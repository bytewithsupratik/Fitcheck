# apps/intelligence/src/upe/provenance.py
from typing import Dict
from src.upe.schemas import UPEProvenance
from src.upe.constants import UPE_MODEL_VERSION, PROGRESS_DIMENSION_WEIGHTS


class ProvenanceBuilder:
    @classmethod
    def build_provenance(
        cls,
        cig_state_version: str,
        target_id: str,
        v_ref: float,
        velocity_epsilon: float,
        progress_epsilon: float,
        dimension_weights: Dict[str, float] = None,
    ) -> UPEProvenance:
        return UPEProvenance(
            cig_state_version=cig_state_version,
            target_id=target_id,
            model_version=UPE_MODEL_VERSION,
            v_ref=v_ref,
            velocity_epsilon=velocity_epsilon,
            progress_epsilon=progress_epsilon,
            dimension_weights=dimension_weights or PROGRESS_DIMENSION_WEIGHTS
        )