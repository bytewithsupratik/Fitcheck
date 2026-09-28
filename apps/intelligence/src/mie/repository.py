# apps/intelligence/src/mie/repository.py
from typing import Dict, List, Optional
from src.mie.schemas import LearningExperience, CodingProject, Assessment, AssessmentResult


class MIERepository:
    def __init__(self):
        self.experiences: Dict[str, LearningExperience] = {}
        self.projects: Dict[str, CodingProject] = {}
        self.assessments: Dict[str, Assessment] = {}
        self.assessment_results: Dict[str, AssessmentResult] = {}
        self.learner_active_experience: Dict[str, str] = {}  # learner_id -> experience_id

    def save_experience(self, exp: LearningExperience):
        self.experiences[exp.experience_id] = exp
        self.learner_active_experience[exp.learner_id] = exp.experience_id
        if exp.coding_project:
            self.projects[exp.coding_project.project_id] = exp.coding_project
        if exp.assessment:
            self.assessments[exp.assessment.assessment_id] = exp.assessment

    def get_experience(self, exp_id: str) -> Optional[LearningExperience]:
        return self.experiences.get(exp_id)

    def get_current_experience(self, learner_id: str) -> Optional[LearningExperience]:
        exp_id = self.learner_active_experience.get(learner_id)
        if not exp_id:
            return None
        return self.experiences.get(exp_id)

    def get_project(self, project_id: str) -> Optional[CodingProject]:
        return self.projects.get(project_id)

    def get_assessment(self, assessment_id: str) -> Optional[Assessment]:
        return self.assessments.get(assessment_id)

    def save_assessment_result(self, res: AssessmentResult):
        self.assessment_results[res.assessment_result_id] = res

    def clear(self):
        self.experiences.clear()
        self.projects.clear()
        self.assessments.clear()
        self.assessment_results.clear()
        self.learner_active_experience.clear()


mie_repository = MIERepository()