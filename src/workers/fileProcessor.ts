import "dotenv/config";
import { getJobWithFile } from "../services/job.service.js";
import { saveResult } from "../services/result.service.js";
import { deleteFile, parseFile } from "../utils/textParser.js";
import { redis } from "../config/redis.js";
import { JobStatus } from "@prisma/client";
import {
  popJob,
  acquireLock,
  renewLock,
  releaseLock,
  updateJobProgress,
  removeFromProcessing,
  cleanupJob,
} from "../services/queue.service.js";
import {
  updateJobStatus,
  incrementJobRetry,
  markJobFailed,
} from "../services/job.service.js";
import { randomUUID } from "crypto";
import { fatal } from "../fatal.js";

const WORKER_ID = `worker-${randomUUID()}`;
const MAX_RETRIES = 3;
const LOCK_RENEW_INTERVAL = 10000; // 10 seconds

const processJob = async (jobId: string): Promise<void> => {
  const locked = await acquireLock(jobId, WORKER_ID);
  if (!locked) {
    console.log(
      `${WORKER_ID} job ${jobId} already locked by another worker , skipping`,
    );
    return;
  }
  console.log(`[${WORKER_ID}] processing job ${jobId}`);
  // renew lock for every 10sec
  const lockRenewer = setInterval(async () => {
    const renewed = await renewLock(jobId, WORKER_ID);
    if (!renewed) {
      console.warn(`[${WORKER_ID}] could not renew lock for job ${jobId}`);
    }
  }, LOCK_RENEW_INTERVAL);

  try {
    await updateJobStatus(jobId, JobStatus.PROCESSING, 10);
    await updateJobProgress(jobId, 10, "processing");
    const job = await getJobWithFile(jobId);
    if (!job || !job.file) {
      throw new Error(`job ${jobId} or associated file not found`);
    }
    await updateJobProgress(jobId, 30, "processing");
    await updateJobStatus(jobId, JobStatus.PROCESSING, 30);
    await updateJobProgress(jobId, 50, "processing");
    await updateJobStatus(jobId, JobStatus.PROCESSING, 50);
    const result = await parseFile(job.file.filePath, job.file.mimeType);

    await updateJobProgress(jobId, 80, "processing");
    await updateJobStatus(jobId, JobStatus.PROCESSING, 80);
    await saveResult(
      jobId,
      result.wordCount,
      result.paragraphCount,
      result.topKeywords,
    );
    deleteFile(job.file.filePath);
    await updateJobProgress(jobId, 100, "completed");
    await updateJobStatus(jobId, JobStatus.COMPLETED, 100);
    await removeFromProcessing(jobId);
    await cleanupJob(jobId);
    console.log(`[${WORKER_ID}] job ${jobId} completed successfully`);
  } catch (e) {
    console.error(`[${WORKER_ID}] Job ${jobId} failed:`, e);
    const retries = await incrementJobRetry(jobId);
    if (retries.retryCount >= MAX_RETRIES) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      await markJobFailed(jobId, errorMsg);
      await updateJobProgress(jobId, 0, "failed");
      await removeFromProcessing(jobId);
      await cleanupJob(jobId);
      console.log(
        `[${WORKER_ID}] job ${jobId} permanently failed after ${MAX_RETRIES} retries`,
      );
    } else {
      await redis.lpush("jobs:waiting", jobId);
      await removeFromProcessing(jobId);
      console.warn(
        `[${WORKER_ID}] job ${jobId} re-queued, attempt ${retries}/${MAX_RETRIES}`,
      );
    }
  } finally {
    clearInterval(lockRenewer);
    await releaseLock(jobId);
  }
};

const startWorker = async (): Promise<void> => {
  console.log(`${WORKER_ID} worker started`);
  while (true) {
    try {
      const jobId = await popJob();
      if (jobId) {
        await processJob(jobId);
      }
    } catch (e) {
      console.log(`[${WORKER_ID}] worker loop error:`, e);
      // wait 1 sec before retrying loop avoid hammering on errors
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
};

startWorker().catch(fatal);
