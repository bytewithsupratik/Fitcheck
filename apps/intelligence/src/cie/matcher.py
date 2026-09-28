# apps/intelligence/src/cie/matcher.py
from typing import List, Dict, Tuple
from src.cie.schemas import (
    TargetProfile,
    CIECapabilityInput,
    CIEGoalInput,
    AlignmentResult,
    CapabilityAlignment,
    RelevanceResult,
    ProficiencyLevel,
    RequirementImportance,
)


class DeterministicMatcher:
    """
    Performs deterministic capability alignment, gap analysis, and
    frozen 50/30/20 relevance score calculation per CIE specifications.
    """

    # Numeric mapping for proficiency comparison
    PROFICIENCY_WEIGHTS: Dict[ProficiencyLevel, int] = {
        ProficiencyLevel.FOUNDATIONAL: 1,
        ProficiencyLevel.DEVELOPING: 2,
        ProficiencyLevel.PROFICIENT: 3,
        ProficiencyLevel.ADVANCED: 4,
    }

    # Weight multipliers based on Requirement Importance
    IMPORTANCE_WEIGHTS: Dict[RequirementImportance, float] = {
        RequirementImportance.CORE: 1.0,
        RequirementImportance.IMPORTANT: 0.7,
        RequirementImportance.SUPPORTING: 0.4,
        RequirementImportance.OPTIONAL: 0.2,
    }

    @classmethod
    def match(
        cls,
        target_profile: TargetProfile,
        goal: CIEGoalInput,
        learner_capabilities: List[CIECapabilityInput],
        career_dna: Dict = None,
    ) -> Tuple[AlignmentResult, RelevanceResult]:
        """
        Executes capability alignment and computes relevance.
        Returns: (AlignmentResult, RelevanceResult)
        """
        career_dna = career_dna or {}

        # 1. Map learner capabilities by capability_id for fast lookup
        learner_cap_map: Dict[str, CIECapabilityInput] = {
            c.capability_id: c for c in learner_capabilities
        }

        # 2. Perform Gap Analysis (Supporting vs Missing vs Required)
        supporting: List[CapabilityAlignment] = []
        missing: List[CapabilityAlignment] = []
        required: List[CapabilityAlignment] = []

        total_weighted_points = 0.0
        earned_weighted_points = 0.0

        for req in target_profile.capability_requirements:
            expected_rank = cls.PROFICIENCY_WEIGHTS[req.expected_proficiency]
            imp_weight = cls.IMPORTANCE_WEIGHTS[req.importance]

            total_weighted_points += expected_rank * imp_weight

            learner_cap = learner_cap_map.get(req.capability_id)

            if learner_cap:
                current_rank = cls.PROFICIENCY_WEIGHTS[learner_cap.proficiency]
                # A capability is SUPPORTING if the learner demonstrates developing, proficient, or advanced
                # Weighted contribution towards capability alignment score
                attained_rank = min(current_rank, expected_rank)
                earned_weighted_points += attained_rank * imp_weight * learner_cap.confidence

                alignment_item = CapabilityAlignment(
                    capability_id=req.capability_id,
                    importance=req.importance,
                    expected_proficiency=req.expected_proficiency,
                    current_proficiency=learner_cap.proficiency,
                    confidence=learner_cap.confidence,
                    status="SUPPORTING" if current_rank >= expected_rank else "MISSING"
                )

                if current_rank >= expected_rank:
                    supporting.append(alignment_item)
                else:
                    missing.append(alignment_item)
            else:
                # Learner has no record for this capability
                alignment_item = CapabilityAlignment(
                    capability_id=req.capability_id,
                    importance=req.importance,
                    expected_proficiency=req.expected_proficiency,
                    current_proficiency=None,
                    confidence=0.0,
                    status="MISSING"
                )
                missing.append(alignment_item)

            # Preserve all in 'required'
            required.append(alignment_item)

        alignment_result = AlignmentResult(
            supporting=supporting,
            missing=missing,
            required=required
        )

        # 3. Calculate Component Scores for Relevance Formula
        # Component A: Capability Alignment (0.0 to 1.0)
        capability_alignment_score = (
            (earned_weighted_points / total_weighted_points)
            if total_weighted_points > 0 else 0.0
        )
        capability_alignment_score = min(1.0, max(0.0, capability_alignment_score))

        # Component B: Goal Alignment (0.0 to 1.0)
        # Direct goal target match yields 1.0; priority scales confidence
        goal_priority_multipliers = {"HIGH": 1.0, "MEDIUM": 0.8, "LOW": 0.6}
        priority_mult = goal_priority_multipliers.get(goal.priority.upper(), 0.8)
        
        if goal.target_id == target_profile.target.target_id:
            goal_alignment_score = 1.0 * priority_mult
        else:
            goal_alignment_score = 0.5 * priority_mult

        # Component C: Career-DNA Alignment (0.0 to 1.0)
        # Assesses domain/preference compatibility from CIG Career DNA
        dna_domains = [d.upper() for d in career_dna.get("preferred_domains", [])]
        target_name_tokens = target_profile.target.name.upper().split()
        
        if any(token in dna_domains for token in target_name_tokens):
            dna_alignment_score = 0.90
        elif dna_domains:
            dna_alignment_score = 0.60
        else:
            dna_alignment_score = 0.70  # Neutral baseline when DNA is sparse

        # 4. Apply Frozen 50/30/20 Formula (Section 24)
        relevance_score = round(
            (0.50 * capability_alignment_score)
            + (0.30 * goal_alignment_score)
            + (0.20 * dna_alignment_score),
            3
        )
        relevance_score = min(1.0, max(0.0, relevance_score))

        # Confidence is derived from the coverage and confidence of learner capabilities
        if learner_capabilities:
            avg_cap_confidence = sum(c.confidence for c in learner_capabilities) / len(learner_capabilities)
            relevance_confidence = round(0.40 + (0.60 * avg_cap_confidence), 2)
        else:
            relevance_confidence = 0.50  # Baseline when cold-starting with no evidence

        relevance_result = RelevanceResult(
            score=relevance_score,
            confidence=relevance_confidence,
            breakdown={
                "capability_alignment": round(capability_alignment_score, 3),
                "goal_alignment": round(goal_alignment_score, 3),
                "career_dna_alignment": round(dna_alignment_score, 3),
            }
        )

        return alignment_result, relevance_result