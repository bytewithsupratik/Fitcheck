# apps/intelligence/src/evidence/taxonomy_registry.py
import re
from typing import List, Dict, Optional, Set
from .schemas import CanonicalCapability, ObservationDTO, ObservationCategory


class UniversalTaxonomyResolver:
    """
    Universally and dynamically normalizes any observed language, package,
    or tool into standardized canonical capabilities without manual dictionaries.
    """

    @staticmethod
    def _sanitize_id(name: str) -> str:
        # Convert any tech name into standard clean format e.g. "react-dom" -> "CAP-REACT-DOM"
        clean = re.sub(r"[^A-Za-z0-9]", "-", name.upper()).strip("-")
        return f"CAP-{clean}"

    @classmethod
    def resolve_universal_capabilities(cls, observations: List[ObservationDTO]) -> List[CanonicalCapability]:
        """
        Dynamically derives the allowed canonical capabilities directly from the
        verified deterministic observations.
        """
        discovered_capabilities: Dict[str, CanonicalCapability] = {}

        # 1. Ignored common build utilities that shouldn't be counted as standalone capabilities
        IGNORED_PACKAGES = {
            "NODEMON", "CHOKIDAR", "ANYMATCH", "BRACES", "PICOMATCH", 
            "MIME-TYPES", "DEBUG", "PATH-TO-REGEXP", "COOKIE", "BODY-PARSER"
        }

        for obs in observations:
            tech_name = obs.name.upper()

            # Skip metadata facts and noisy micro-dependencies
            if obs.category == ObservationCategory.REPOSITORY_METADATA:
                continue
            if tech_name in IGNORED_PACKAGES:
                continue

            # Case A: Language & Structure (e.g. css, javascript, python, rust)
            if obs.category == ObservationCategory.STRUCTURE:
                cap_id = cls._sanitize_id(obs.name)
                if cap_id not in discovered_capabilities:
                    discovered_capabilities[cap_id] = CanonicalCapability(
                        capability_id=cap_id,
                        name=f"{obs.name.capitalize()} Implementation",
                        category="DEVELOPMENT",
                        description=f"Demonstrated software development and structuring using {obs.name}."
                    )

            # Case B: Dependencies / Frameworks (e.g. express, react, pg, tensorflow)
            elif obs.category == ObservationCategory.DEPENDENCY:
                # Group common scoped names e.g. @angular/core -> ANGULAR
                root_name = obs.name.split("/")[-1].split(".")[0]
                if root_name.upper() in IGNORED_PACKAGES:
                    continue

                cap_id = cls._sanitize_id(root_name)
                if cap_id not in discovered_capabilities:
                    discovered_capabilities[cap_id] = CanonicalCapability(
                        capability_id=cap_id,
                        name=f"{root_name.capitalize()} Integration",
                        category="FRAMEWORK_OR_LIBRARY",
                        description=f"Integration and usage of {root_name} dependency."
                    )

            # Case C: Automated Testing
            elif obs.category == ObservationCategory.TEST:
                cap_id = "CAP-TESTING"
                if cap_id not in discovered_capabilities:
                    discovered_capabilities[cap_id] = CanonicalCapability(
                        capability_id=cap_id,
                        name="Automated Testing",
                        category="QUALITY",
                        description="Implementation of automated test suites and test verification."
                    )

            # Case D: Documentation
            elif obs.category == ObservationCategory.DOCUMENTATION and "readme" in obs.name.lower():
                cap_id = "CAP-DOCUMENTATION"
                if cap_id not in discovered_capabilities:
                    discovered_capabilities[cap_id] = CanonicalCapability(
                        capability_id=cap_id,
                        name="Technical Documentation",
                        category="PRACTICE",
                        description="Structuring technical documentation and README guides."
                    )

        # Fallback: If nothing specific was found, provide general software engineering
        if not discovered_capabilities:
            discovered_capabilities["CAP-SOFTWARE-ENGINEERING"] = CanonicalCapability(
                capability_id="CAP-SOFTWARE-ENGINEERING",
                name="Software Engineering Fundamentals",
                category="ENGINEERING",
                description="General software project structure and engineering practices."
            )

        return list(discovered_capabilities.values())


class DynamicTaxonomyRegistry:
    """
    Maintains compatibility with pre-seeded database catalogs while
    using UniversalTaxonomyResolver whenever manual catalogs are omitted.
    """
    def __init__(self, capabilities: Optional[List[CanonicalCapability]] = None):
        self._manual_capabilities = capabilities

    def resolve_relevant_capabilities(self, observations: List[ObservationDTO]) -> List[CanonicalCapability]:
        if self._manual_capabilities:
            # If database or caller explicitly provided a restricted rubric, respect it
            return self._manual_capabilities
        
        # Otherwise, dynamically and universally canonicalize from the facts
        return UniversalTaxonomyResolver.resolve_universal_capabilities(observations)