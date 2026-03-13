import { getResultByJobId } from "../services/result.service.js";
import { getJobFromRedis } from "../services/queue.service.js";
import { getJobStatus } from "../services/job.service.js";
import type { Request, Response } from "express";

const jobStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "id is required",
        success: false,
      });
    }
    const redisJob = await getJobFromRedis(id);
    if (redisJob && Object.keys(redisJob).length > 0) {
      return res.status(200).json({
        message: "got job status from redis",
        success: true,
        jobId: id,
        status: redisJob.status,
        progress: parseInt(redisJob.progress!),
      });
    }
    const job = await getJobStatus(id);
    if (!job) {
      return res.status(404).json({ message: "job not found", success: false });
    }
    return res.status(200).json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: "internal server error",
      success: false,
    });
  }
};

const jobResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "id is required",
        success: false,
      });
    }
    const job = await getJobStatus(id);
    if (!job) {
      return res.status(404).json({ message: "job not found", success: false });
    }
    if (job.status !== "COMPLETED") {
      return res.status(400).json({
        error: "job is not completed yet",
        status: job.status,
        progress: job.progress,
      });
    }
    const result = await getResultByJobId(id);
    if (!result) {
      res.status(404).json({ message: "result not found", success: false });
      return;
    }
    return res.status(200).json({
      jobId: result.jobId,
      wordCount: result.wordCount,
      paragraphCount: result.paragraphCount,
      topKeywords: result.keywords,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: "internal server error",
      success: false,
    });
  }
};

export { jobStatus, jobResult };
