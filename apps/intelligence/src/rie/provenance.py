# apps/intelligence/src/rie/provenance.py
from src.rie.schemas import RIEProvenance
from src.rie.constants import RIE_MODEL_VERSION


class ProvenanceBuilder:
    @classmethod
    def build_provenance(
        cls,
        cig_state_version: str,
        cie_evaluation_id: str,
        cie_version: str,
    ) -> RIEProvenance:
        return RIEProvenance(
            cig_state_version=cig_state_version,
            cie_evaluation_id=cie_evaluation_id,
            cie_version=cie_version,
            model_version=RIE_MODEL_VERSION
        )