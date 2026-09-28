# apps/intelligence/src/upe/validator.py
from src.upe.schemas import ProgressEvaluation


class UPEValidationError(Exception):
    pass


class UPEValidator:
    """
    Validates UPE outputs against numerical bounds, mathematical consistency,
    provenance, and contract invariants (Section 27).
    """

    @classmethod
    def validate_evaluation(cls, evaluation: ProgressEvaluation) -> ProgressEvaluation:
        # 1. Numerical Bounds (0.00 <= score <= 1.00)
        bounds_to_check = [
            ("overall_progress", evaluation.overall_progress),
            ("depth", evaluation.depth),
        ]
        if evaluation.velocity is not None:
            bounds_to_check.append(("velocity", evaluation.velocity))
        if evaluation.consistency is not None:
            bounds_to_check.append(("consistency", evaluation.consistency))
        if evaluation.alignment is not None:
            bounds_to_check.append(("alignment", evaluation.alignment))

        for name, val in bounds_to_check:
            if not (0.0 <= val <= 1.0):
                raise UPEValidationError(f"Progress score '{name}' out of bounds [0.0, 1.0]: {val}")

        # 2. Mathematical Consistency Check
        dim_weights = evaluation.provenance.dimension_weights
        active_w = {}
        weighted_sum = 0.0

        for dim, val in [
            ("depth", evaluation.depth),
            ("velocity", evaluation.velocity),
            ("consistency", evaluation.consistency),
            ("alignment", evaluation.alignment),
        ]:
            if val is not None:
                w = dim_weights.get(dim, 0.0)
                active_w[dim] = w
                weighted_sum += val * w

        expected_overall = (
            round(weighted_sum / sum(active_w.values()), 4)
            if sum(active_w.values()) > 0 else 0.0
        )
        if abs(evaluation.overall_progress - expected_overall) > 0.001:
            raise UPEValidationError(
                f"Mathematical mismatch in overall progress: recorded {evaluation.overall_progress} vs calculated {expected_overall}"
            )

        # 3. Source Integrity & Provenance
        if not evaluation.source_state.cig_state_version:
            raise UPEValidationError("Missing CIG state version in progress source state.")

        return evaluation