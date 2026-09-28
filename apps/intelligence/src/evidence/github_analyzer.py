# apps/intelligence/src/evidence/github_analyzer.py
import re
import json
import base64
from typing import List, Dict, Any, Optional
import httpx

from src.evidence.schemas import ObservationDTO, ObservationCategory


class GitHubAnalyzerError(Exception):
    pass


class InsufficientEvidenceError(GitHubAnalyzerError):
    """Raised when repository exists but has no usable technical artifacts."""
    pass


class DeterministicGitHubAnalyzer:
    def __init__(self, github_token: Optional[str] = None):
        headers = {"Accept": "application/vnd.github.v3+json"}
        if github_token:
            headers["Authorization"] = f"Bearer {github_token}"
        self.client = httpx.Client(base_url="https://api.github.com", headers=headers, timeout=15.0)

    def parse_repo_url(self, url: str) -> Dict[str, str]:
        # Support URLs with or without .git and trailing slashes
        clean_url = re.sub(r"\.git/?$", "", url.strip())
        pattern = r"^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$"
        match = re.match(pattern, clean_url)
        if not match:
            raise GitHubAnalyzerError(f"Invalid GitHub URL format: {url}")
        return {"owner": match.group(1), "repo": match.group(2)}

    def analyze_repository(self, repo_url: str, evidence_id: str) -> List[ObservationDTO]:
        coords = self.parse_repo_url(repo_url)
        owner, repo = coords["owner"], coords["repo"]

        # 1. Fetch Repository Metadata
        repo_resp = self.client.get(f"/repos/{owner}/{repo}")
        if repo_resp.status_code == 404:
            raise GitHubAnalyzerError(f"Repository {owner}/{repo} not found or is private.")
        if repo_resp.status_code != 200:
            raise GitHubAnalyzerError(f"GitHub API Error: {repo_resp.text}")

        repo_data = repo_resp.json()
        default_branch = repo_data.get("default_branch", "main")

        # 2. Fetch Git Tree
        tree_resp = self.client.get(f"/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1")
        if tree_resp.status_code != 200:
            raise GitHubAnalyzerError(f"Failed to fetch repository tree: {tree_resp.text}")

        tree_items = tree_resp.json().get("tree", [])
        if not tree_items:
            raise InsufficientEvidenceError("Repository is empty (zero files committed).")

        observations: List[ObservationDTO] = []

        # Observation 1: Metadata
        observations.append(
            ObservationDTO(
                observation_id=f"OBS_META_{owner}_{repo}",
                evidence_id=evidence_id,
                category=ObservationCategory.REPOSITORY_METADATA,
                name="repository_metadata",
                value={
                    "owner": owner,
                    "repo": repo,
                    "primary_language": repo_data.get("language"),
                    "total_files": len(tree_items),
                    "default_branch": default_branch
                },
                source_location="github:metadata",
                verified=True
            )
        )

        # 3. Detect ALL package.json files (Root OR Subfolders like client/, server/, frontend/)
        pkg_items = [item for item in tree_items if item["path"].endswith("package.json")]
        for pkg_item in pkg_items[:3]:  # Limit top 3 manifests to avoid overflow
            pkg_content = self._fetch_file_content(owner, repo, pkg_item["path"])
            if pkg_content:
                try:
                    pkg = json.loads(pkg_content)
                    deps = {**(pkg.get("dependencies") or {}), **(pkg.get("devDependencies") or {})}
                    for dep_name, dep_ver in deps.items():
                        clean_name = dep_name.replace("@", "").replace("/", "_").lower()
                        observations.append(
                            ObservationDTO(
                                observation_id=f"OBS_DEP_{clean_name}",
                                evidence_id=evidence_id,
                                category=ObservationCategory.DEPENDENCY,
                                name=dep_name.lower(),
                                value=dep_ver,
                                source_location=f"{pkg_item['path']}:dependencies",
                                verified=True
                            )
                        )
                except Exception:
                    pass

        # 4. Detect Python requirements (Root OR Subfolders)
        req_items = [item for item in tree_items if item["path"].endswith("requirements.txt")]
        for req_item in req_items[:2]:
            req_content = self._fetch_file_content(owner, repo, req_item["path"])
            if req_content:
                for line in req_content.splitlines():
                    cleaned = line.strip().split("==")[0].split(">=")[0].strip()
                    if cleaned and not cleaned.startswith("#"):
                        observations.append(
                            ObservationDTO(
                                observation_id=f"OBS_DEP_PY_{cleaned.lower()}",
                                evidence_id=evidence_id,
                                category=ObservationCategory.DEPENDENCY,
                                name=cleaned.lower(),
                                value="installed",
                                source_location=req_item["path"],
                                verified=True
                            )
                        )

        # 5. Language & Source File Extension Distribution
        code_extensions = {
            ".js": "javascript",
            ".jsx": "react",
            ".ts": "typescript",
            ".tsx": "react",
            ".py": "python",
            ".html": "html",
            ".css": "css"
        }
        detected_extensions = set()
        for item in tree_items:
            for ext, tech in code_extensions.items():
                if item["path"].endswith(ext):
                    detected_extensions.add(tech)

        for tech in detected_extensions:
            observations.append(
                ObservationDTO(
                    observation_id=f"OBS_LANG_{tech.upper()}",
                    evidence_id=evidence_id,
                    category=ObservationCategory.STRUCTURE,
                    name=tech,
                    value={"source_files_detected": True},
                    source_location="repository:files",
                    verified=True
                )
            )

        # 6. Detect Test Files & Suites
        test_files = [
            item["path"] for item in tree_items
            if item["type"] == "blob" and (
                ".test." in item["path"] or ".spec." in item["path"] or
                "test/" in item["path"] or "tests/" in item["path"]
            )
        ]
        if test_files:
            observations.append(
                ObservationDTO(
                    observation_id=f"OBS_TEST_SUITE_{len(test_files)}",
                    evidence_id=evidence_id,
                    category=ObservationCategory.TEST,
                    name="test_suite_detected",
                    value={"file_count": len(test_files), "sample_files": test_files[:5]},
                    source_location=test_files[0],
                    verified=True
                )
            )

        # 7. Detect Documentation (README)
        readme_item = next((item for item in tree_items if re.match(r"^readme\.md$", item["path"], re.IGNORECASE)), None)
        if readme_item:
            readme_content = self._fetch_file_content(owner, repo, readme_item["path"])
            size = len(readme_content) if readme_content else 0
            has_api = bool(re.search(r"#.*(api|routes|endpoints)", readme_content or "", re.IGNORECASE))
            has_setup = bool(re.search(r"#.*(install|setup|getting started)", readme_content or "", re.IGNORECASE))
            observations.append(
                ObservationDTO(
                    observation_id="OBS_DOC_README",
                    evidence_id=evidence_id,
                    category=ObservationCategory.DOCUMENTATION,
                    name="readme_detected",
                    value={"size_bytes": size, "has_api_section": has_api, "has_setup_guide": has_setup},
                    source_location=readme_item["path"],
                    verified=True
                )
            )

        # Architectural Guard (Section 7): If only metadata was extracted and 0 code/facts found
        if len(observations) <= 1:
            raise InsufficientEvidenceError(
                f"Repository '{owner}/{repo}' exists but does not contain enough recognizable code, "
                "manifests (package.json/requirements.txt), or documentation for evaluation."
            )

        return observations

    def _fetch_file_content(self, owner: str, repo: str, file_path: str) -> Optional[str]:
        try:
            resp = self.client.get(f"/repos/{owner}/{repo}/contents/{file_path}")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("encoding") == "base64" and data.get("content"):
                    return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
            return None
        except Exception:
            return None