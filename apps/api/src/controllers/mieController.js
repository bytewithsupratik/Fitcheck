import { mieService } from "../services/mieService.js";
import { BadRequestError } from "../utils/errors.js";

export const mieController = {
  // 1. POST /learning/generate
  async generateExperience(req, res, next) {
    try {
      const data = await mieService.generateExperience(req.user.id, {
        requestId: req.requestId,
        correlationId: req.headers["x-correlation-id"],
      });
      res.status(201).json({ message: "Learning experience generated successfully", data });
    } catch (error) {
      next(error);
    }
  },

  // 2. GET /learning/experiences/:id
  async getExperienceById(req, res, next) {
    try {
      const data = await mieService.getExperienceById(req.params.id, {
        requestId: req.requestId,
      });
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  // 3. GET /learning/current
  async getCurrentExperience(req, res, next) {
    try {
      const data = await mieService.getCurrentExperience(req.user.id, {
        requestId: req.requestId,
      });
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  // 4. GET /learning/experiences/:id/resources
  async getResources(req, res, next) {
    try {
      const data = await mieService.getResources(req.params.id, {
        requestId: req.requestId,
      });
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  // 5. GET /learning/experiences/:id/project
  async getProject(req, res, next) {
    try {
      const data = await mieService.getProject(req.params.id, {
        requestId: req.requestId,
      });
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  // 6. POST /learning/projects/:projectId/submission
  async submitProject(req, res, next) {
    try {
      const { github_url } = req.body;
      if (!github_url) throw new BadRequestError("github_url is required");

      const data = await mieService.submitProject(req.params.projectId, github_url, {
        requestId: req.requestId,
      });
      res.status(200).json({ message: "Project submitted successfully", data });
    } catch (error) {
      next(error);
    }
  },

  // 7. GET /learning/experiences/:id/assessment
  async getAssessment(req, res, next) {
    try {
      const data = await mieService.getAssessment(req.params.id, {
        requestId: req.requestId,
      });
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  // 8. POST /learning/assessments/:assessmentId/attempts
  async startAssessmentAttempt(req, res, next) {
    try {
      const data = await mieService.startAssessmentAttempt(req.params.assessmentId, {
        requestId: req.requestId,
      });
      res.status(200).json({ message: "Assessment attempt started", data });
    } catch (error) {
      next(error);
    }
  },

  // 9. POST /learning/assessments/:assessmentId/submit
  async submitAssessment(req, res, next) {
    try {
      const { learner_answers } = req.body;
      if (!learner_answers) throw new BadRequestError("learner_answers object is required");

      const data = await mieService.submitAssessment(req.params.assessmentId, learner_answers, {
        requestId: req.requestId,
      });
      res.status(200).json({ message: "Assessment submitted successfully", data });
    } catch (error) {
      next(error);
    }
  },

  // 10. POST /learning/experiences/:id/steps/:stepId/complete
  async completeStep(req, res, next) {
    try {
      const data = await mieService.completeStep(req.params.id, req.params.stepId, {
        requestId: req.requestId,
      });
      res.status(200).json({ message: "Step completed successfully", data });
    } catch (error) {
      next(error);
    }
  },
};