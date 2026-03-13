import { jobStatus, jobResult } from "../controllers/job.controller.js";
import { Router } from "express";

const jobRouter = Router();

jobRouter.get("/:id/status", jobStatus);
jobRouter.get("/:id/result", jobResult);

export { jobRouter };
