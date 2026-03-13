import { uploadRouter } from "./upload.routes.js";
import { jobRouter } from "./job.routes.js";
import { Router } from "express";

const router = Router();

router.use("/uploads", uploadRouter);
router.use("/jobs", jobRouter);

export { router };
