# apps/intelligence/src/evidence/report_analyzer.py
import re
from typing import List, Optional, Dict, Any
from src.evidence.schemas import ObservationDTO, ObservationCategory


class ReportAnalyzerError(Exception):
    pass


class DocumentReportAnalyzer:
    """
    Analyzes technical project reports (text or extracted PDF pages).
    Segments content into verifiable section-level observations with page/heading provenance.
    """
    def __init__(self):
        # Common technical domains to look for in written engineering reports
        self.tech_indicators = {
            "postgresql": ["postgresql", "postgres", "relational database", "acid", "sql schema"],
            "react": ["react", "frontend component", "jsx", "virtual dom", "spa"],
            "docker": ["docker", "container", "dockerfile", "containerization"],
            "api_design": ["rest api", "endpoints", "http methods", "json payload", "openapi"],
            "system_design": ["microservices", "load balancer", "caching", "architecture", "scalability"],
            "testing": ["unit testing", "integration testing", "test coverage", "jest", "pytest"]
        }

    def analyze_text_report(
        self,
        report_text: str,
        evidence_id: str,
        pages: Optional[List[Dict[str, Any]]] = None
    ) -> List[ObservationDTO]:
        """
        Analyzes full report text or structured pages.
        pages format: [{"page_number": 1, "text": "..."}]
        """
        if not report_text or len(report_text.strip()) < 50:
            raise ReportAnalyzerError("Report content is too short or insufficient for technical evaluation.")

        observations: List[ObservationDTO] = []

        # If pages are provided, analyze page by page; otherwise, split by section headers
        if pages:
            observations.extend(self._analyze_pages(pages, evidence_id))
        else:
            observations.extend(self._analyze_sections(report_text, evidence_id))

        if not observations:
            raise ReportAnalyzerError("No verifiable technical observations could be extracted from this report.")

        return observations

    def _analyze_sections(self, text: str, evidence_id: str) -> List[ObservationDTO]:
        observations = []
        # Split by Markdown-style headings or capitalised headers
        raw_sections = re.split(r"\n(?=#{1,3}\s|[A-Z\s]{4,}:)", text)

        for idx, sec in enumerate(raw_sections):
            lines = [l.strip() for l in sec.strip().splitlines() if l.strip()]
            if not lines:
                continue

            heading = lines[0].replace("#", "").strip()
            body = " ".join(lines[1:]) if len(lines) > 1 else lines[0]

            # Record section observation
            sec_obs_id = f"OBS_SEC_{evidence_id}_{idx + 1}"
            observations.append(
                ObservationDTO(
                    observation_id=sec_obs_id,
                    evidence_id=evidence_id,
                    category=ObservationCategory.DOCUMENTATION,
                    name="report_section_detected",
                    value={"section_title": heading, "word_count": len(body.split())},
                    source_location=f"section: '{heading}'",
                    verified=True
                )
            )

            # Detect verified technical topics within this section
            self._extract_technical_facts(body, f"section: '{heading}'", evidence_id, idx, observations)

        return observations

    def _analyze_pages(self, pages: List[Dict[str, Any]], evidence_id: str) -> List[ObservationDTO]:
        observations = []
        for p_idx, page in enumerate(pages):
            page_num = page.get("page_number", p_idx + 1)
            content = page.get("text", "")

            # Record page observation
            observations.append(
                ObservationDTO(
                    observation_id=f"OBS_PAGE_{evidence_id}_{page_num}",
                    evidence_id=evidence_id,
                    category=ObservationCategory.DOCUMENTATION,
                    name="report_page_content",
                    value={"page": page_num, "word_count": len(content.split())},
                    source_location=f"page: {page_num}",
                    verified=True
                )
            )

            self._extract_technical_facts(content, f"page: {page_num}", evidence_id, page_num, observations)

        return observations

    def _extract_technical_facts(
        self, text: str, location: str, evidence_id: str, seq: int, observations: List[ObservationDTO]
    ):
        text_lower = text.lower()
        for tech_name, keywords in self.tech_indicators.items():
            matched_keywords = [kw for kw in keywords if kw in text_lower]
            if matched_keywords:
                obs_id = f"OBS_TECH_{tech_name.upper()}_{evidence_id}_{seq}"
                observations.append(
                    ObservationDTO(
                        observation_id=obs_id,
                        evidence_id=evidence_id,
                        category=ObservationCategory.STRUCTURE,
                        name=tech_name,
                        value={
                            "topic": tech_name,
                            "matched_terms": matched_keywords,
                            "excerpt": text[:150] + "..."
                        },
                        source_location=location,
                        verified=True
                    )
                )