# apps/intelligence/src/ade/impact/calculator.py
from src.ade.schemas import ADEDecisionContext, StructuredImpact
from src.ade.enums import ImpactLevel
from src.ade.events.schemas import EventEnvelope


class ImpactCalculator:
    """
    Evaluates magnitude, persistence, scope, and trajectory relevance (Section 14).
    Produces structured impact information consumed by candidate rules.
    """

    @classmethod
    def calculate_impact(
        cls,
        event: EventEnvelope,
        context: ADEDecisionContext
    ) -> StructuredImpact:
        data = event.data or {}
        event_type = event.event_type

        # 1. Target & Goal Changes -> CRITICAL
        if event_type in ["TARGET_CHANGED", "CHANGE_CAREER_TARGET", "GOAL_CHANGED", "ABANDON_LEARNING_PATH"]:
            return StructuredImpact(
                magnitude=1.0,
                persistence=1.0,
                scope="GOAL",
                trajectory_relevance=1.0,
                learning_state_effect="FULL_TRAJECTORY_RESET",
                impact_level=ImpactLevel.CRITICAL
            )

        # 2. Topic Changes / Sequence Mismatch -> HIGH
        if event_type in ["REQUIREMENTS_CHANGED", "CHANGE_TOPIC", "EXPERIENCE_BLOCKED"]:
            return StructuredImpact(
                magnitude=0.8,
                persistence=0.8,
                scope="TRAJECTORY",
                trajectory_relevance=0.85,
                learning_state_effect="CURRICULUM_PIVOT",
                impact_level=ImpactLevel.HIGH
            )

        # 3. High Readiness Gap / Major Regression -> HIGH
        if event_type == "READINESS_EVALUATED":
            priority_gaps = data.get("priority_gap_count", 0)
            readiness = float(data.get("overall_readiness", 0.5))
            if priority_gaps >= 3 or readiness < 0.35:
                return StructuredImpact(
                    magnitude=0.75,
                    persistence=0.7,
                    scope="CAPABILITY",
                    trajectory_relevance=0.7,
                    learning_state_effect="REMEDIATION_REQUIRED",
                    impact_level=ImpactLevel.HIGH
                )

        # 4. Progress Signals (UPE)
        if event_type == "PROGRESS_EVALUATED":
            trend = data.get("trend")
            vel_trend = data.get("velocity_trend")
            if trend == "DECLINING" or vel_trend == "SLOWING":
                return StructuredImpact(
                    magnitude=0.6,
                    persistence=0.6,
                    scope="EXPERIENCE",
                    trajectory_relevance=0.6,
                    learning_state_effect="PACING_ADAPTATION",
                    impact_level=ImpactLevel.MEDIUM
                )
            if trend == "IMPROVING" or vel_trend == "ACCELERATING":
                return StructuredImpact(
                    magnitude=0.5,
                    persistence=0.5,
                    scope="EXPERIENCE",
                    trajectory_relevance=0.5,
                    learning_state_effect="ACCELERATION_ELIGIBLE",
                    impact_level=ImpactLevel.MEDIUM
                )

        # Default Low Impact baseline
        return StructuredImpact(
            magnitude=0.2,
            persistence=0.2,
            scope="CAPABILITY",
            trajectory_relevance=0.2,
            learning_state_effect="NORMAL_CONTINUATION",
            impact_level=ImpactLevel.LOW
        )