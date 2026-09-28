# apps/intelligence/src/mie/resources/selector.py
from typing import List
from src.mie.schemas import Resource
from src.mie.enums import ResourceType, ResourceValidationStatus
from src.mie.constants import RESOURCE_RANKING_WEIGHTS, DIFFICULTY_RANKS
from src.mie.resources.catalog import CURATED_RESOURCES
from src.mie.resources.discoverer import LiveResourceDiscoverer
from src.evidence.schemas import ProficiencyLevel


class ResourceSelector:
    """
    Selects, discovers from real-world web/YouTube, filters, ranks,
    and guarantees multi-modal diversity (Video + Docs) per Section 11 & 63.
    """

    @classmethod
    def select_resources(
        cls,
        target_capability_ids: List[str],
        target_learning_req_ids: List[str],
        learner_difficulty: ProficiencyLevel,
        available_resources: List[Resource] = None,
        max_resources: int = 3
    ) -> List[Resource]:
        pool: List[Resource] = list(available_resources) if available_resources is not None else list(CURATED_RESOURCES)

        # 1. Real-World Live Discovery fallback if pool lacks coverage
        covered_caps = {c for r in pool for c in r.capability_ids}
        discoverer = LiveResourceDiscoverer()

        for cap_id in target_capability_ids:
            has_video = any(cap_id in r.capability_ids and r.type == ResourceType.VIDEO for r in pool)
            has_doc = any(cap_id in r.capability_ids and r.type in [ResourceType.DOCUMENTATION, ResourceType.ARTICLE] for r in pool)

            if not has_video or not has_doc:
                topic_name = cap_id.replace("CAP-", "").replace("-", " ")
                live_resources = discoverer.discover(
                    capability_id=cap_id,
                    topic=topic_name,
                    difficulty=learner_difficulty
                )
                pool.extend(live_resources)

        # 2. Strict Filtering (Section 11 & 63)
        filtered: List[Resource] = []
        for res in pool:
            if res.validation_status != ResourceValidationStatus.VALID:
                continue
            has_cap_overlap = any(c in target_capability_ids for c in res.capability_ids)
            has_lr_overlap = any(lr in target_learning_req_ids for lr in res.learning_requirement_ids)
            if has_cap_overlap or has_lr_overlap:
                filtered.append(res)

        # 3. Deterministic Ranking Formula (Section 11)
        scored: List[tuple[float, Resource]] = []
        learner_diff_rank = DIFFICULTY_RANKS.get(learner_difficulty, 2)

        for res in filtered:
            lr_overlap = sum(1 for lr in res.learning_requirement_ids if lr in target_learning_req_ids)
            req_align = min(1.0, lr_overlap / max(1, len(target_learning_req_ids))) if target_learning_req_ids else 0.8

            cap_overlap = sum(1 for c in res.capability_ids if c in target_capability_ids)
            cap_align = min(1.0, cap_overlap / max(1, len(target_capability_ids)))

            res_diff_rank = DIFFICULTY_RANKS.get(res.difficulty, 2)
            diff_delta = abs(learner_diff_rank - res_diff_rank)
            diff_fit = max(0.0, 1.0 - (diff_delta * 0.33))

            quality = res.quality_score
            context_fit = 1.0 if res.language == "en" else 0.5

            w = RESOURCE_RANKING_WEIGHTS
            total_score = (
                w["requirement_alignment"] * req_align +
                w["capability_alignment"] * cap_align +
                w["difficulty_fit"] * diff_fit +
                w["quality_score"] * quality +
                w["learner_context_fit"] * context_fit
            )

            res.relevance_score = round(total_score, 4)
            scored.append((total_score, res))

        scored.sort(key=lambda x: x[0], reverse=True)

        # 4. Multi-Modal Diversity: Ensure at least one Video and at least one Documentation
        selected: List[Resource] = []
        video_candidates = [item[1] for item in scored if item[1].type == ResourceType.VIDEO]
        doc_candidates = [item[1] for item in scored if item[1].type in [ResourceType.DOCUMENTATION, ResourceType.ARTICLE, ResourceType.TUTORIAL]]

        if video_candidates:
            selected.append(video_candidates[0])

        if doc_candidates and doc_candidates[0].resource_id not in [s.resource_id for s in selected]:
            selected.append(doc_candidates[0])

        # Fill remaining slots from highest scored candidates without duplicate URLs
        for _, res in scored:
            if len(selected) >= max_resources:
                break
            if res.url not in [s.url for s in selected] and res.resource_id not in [s.resource_id for s in selected]:
                selected.append(res)

        # 5. Guarantee final list is strictly ordered descending by relevance score (Section 11)
        selected.sort(key=lambda r: r.relevance_score, reverse=True)

        return selected