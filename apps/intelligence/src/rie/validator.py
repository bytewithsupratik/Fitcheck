# apps/intelligence/src/rie/validator.py
from src.rie.schemas import RIEOutput
from src.rie.enums import CapabilityReadinessState


class RIEValidationError(Exception):
    pass


class RIEValidator:
    """
    Validates RIE output against mathematical bounds, logical consistency,
    and contract invariants (Section 28).
    """

    @classmethod
    def validate_output(cls, output: RIEOutput) -> RIEOutput:
        # 1. Numeric bounds checks (0.0 <= score <= 1.0)
        readiness = output.readiness
        scores_to_check = [
            ("overall", readiness.overall),
            ("technical_capability", readiness.technical_capability),
            ("confidence", readiness.confidence),
            ("goal_alignment", readiness.goal_alignment),
        ]
        if readiness.evidence_strength is not None:
            scores_to_check.append(("evidence_strength", readiness.evidence_strength))
        if readiness.experience is not None:
            scores_to_check.append(("experience", readiness.experience))
        if readiness.consistency is not None:
            scores_to_check.append(("consistency", readiness.consistency))

        for name, val in scores_to_check:
            if not (0.0 <= val <= 1.0):
                raise RIEValidationError(f"Readiness score '{name}' out of bounds: {val}")

        # 2. State consistency & Logical contradiction checks
        for cap in output.capabilities:
            if cap.attained_rank >= cap.required_rank and cap.state != CapabilityReadinessState.READY:
                raise RIEValidationError(
                    f"Contradictory state for {cap.capability_id}: attained >= required but state is {cap.state}"
                )
            if cap.attained_rank == 0 and cap.state != CapabilityReadinessState.NOT_READY:
                raise RIEValidationError(
                    f"Contradictory state for {cap.capability_id}: attained is 0 but state is {cap.state}"
                )

        # 3. Priority gaps validation
        for gap in output.priority_gaps:
            if not (0.0 <= gap.priority <= 1.0):
                raise RIEValidationError(f"Gap priority out of bounds for {gap.capability_id}: {gap.priority}")

        # 4. Provenance validation
        prov = output.provenance
        if not prov.cig_state_version or not prov.cie_evaluation_id or not prov.model_version:
            raise RIEValidationError("Incomplete provenance references in RIE output.")

        return output