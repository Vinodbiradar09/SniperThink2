import "dotenv/config";
import { markJobFailed } from "../services/job.service.js";
import { redis } from "../config/redis.js";
import {
  getProcessingJobs,
  removeFromProcessing,
  incrementRetry,
  JOB_HASH_PREFIX,
} from "../services/queue.service.js";
import { fatal } from "../fatal.js";

const STALE_JOB_THRESHOLD = 60000; // 60 seconds
const WATCHDOG_INTERVAL = 30000; // check every 30 seconds
const MAX_RETRIES = 3;

const checkStaleJobs = async (): Promise<void> => {
  const processingJobs = await getProcessingJobs();
  if (processingJobs.length === 0) return;
  console.log(`[watchdog] checking ${processingJobs.length} processing jobs`);
  for (const jobId of processingJobs) {
    const jobData = await redis.hgetall(`${JOB_HASH_PREFIX}${jobId}`);
    if (!jobData || Object.keys(jobData).length === 0) {
      // hash has gone but the job still in processing clean it up
      await removeFromProcessing(jobId);
      console.warn(`[watchdog] cleaned up orphaned job ${jobId}`);
      continue;
    }
    const lock = await redis.get(`lock:job:${jobId}`);
    if (lock) {
      continue;
    }
    const retries = await incrementRetry(jobId);
    console.warn(
      `[watchdog] stale job detected: ${jobId}, retry ${retries}/${MAX_RETRIES}`,
    );
    if (retries >= MAX_RETRIES) {
      await markJobFailed(
        jobId,
        "job failed after maximum retries worker crash detected",
      );
      await removeFromProcessing(jobId);
      await redis.del(`${JOB_HASH_PREFIX}${jobId}`);
      console.error(`[watchdog] job ${jobId} permanently failed`);
    } else {
      await redis.lpush("jobs:waiting", jobId);
      await removeFromProcessing(jobId);
      console.log(`[watchdog] job ${jobId} re-queued by watchdog`);
    }
  }
};

const startWatchDog = async (): Promise<void> => {
  console.log("[watchdog] watchdog started");
  while (true) {
    try {
      await checkStaleJobs();
    } catch (e) {
      console.error("[watchdog] watchdog error:", e);
    }

    await new Promise((res) => setTimeout(res, WATCHDOG_INTERVAL));
  }
};

startWatchDog().catch(fatal);
