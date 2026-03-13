import { redis } from "../config/redis.js";

const WAITING_LIST = "jobs:waiting";
const PROCESSING_LIST = "jobs:processing";
const JOB_HASH_PREFIX = "job:";
const LOCK_PREFIX = "lock:job:";
const LOCK_TTL = 30000; // 30 seconds

const pushJob = async (jobId: string): Promise<void> => {
  await redis.lpush(WAITING_LIST, jobId);
  await redis.hset(`${JOB_HASH_PREFIX}${jobId}`, {
    status: "pending",
    progress: 0,
    retries: 0,
  });
};

const popJob = async (): Promise<string | null> => {
  const result = await redis.brpoplpush(WAITING_LIST, PROCESSING_LIST, 5);
  return result;
};

const acquireLock = async (
  jobId: string,
  workerId: string,
): Promise<boolean> => {
  const result = await redis.set(
    `${LOCK_PREFIX}${jobId}`,
    workerId,
    "PX",
    LOCK_TTL,
    "NX",
  );
  return result === "OK";
};

const renewLock = async (jobId: string, workerId: string): Promise<boolean> => {
  const current = await redis.get(`${LOCK_PREFIX}${jobId}`);
  if (current !== workerId) return false;
  await redis.pexpire(`${LOCK_PREFIX}${jobId}`, LOCK_TTL);
  return true;
};

const releaseLock = async (jobId: string): Promise<void> => {
  await redis.del(`${LOCK_PREFIX}${jobId}`);
};

const updateJobProgress = async (
  jobId: string,
  progress: number,
  status: string,
): Promise<void> => {
  await redis.hset(`${JOB_HASH_PREFIX}${jobId}`, {
    progress,
    status,
  });
};

const getJobFromRedis = async (
  jobId: string,
): Promise<Record<string, string>> => {
  return redis.hgetall(`${JOB_HASH_PREFIX}${jobId}`);
};

const removeFromProcessing = async (jobId: string): Promise<void> => {
  await redis.lrem(PROCESSING_LIST, 1, jobId);
};

const incrementRetry = async (jobId: string): Promise<number> => {
  return redis.hincrby(`${JOB_HASH_PREFIX}${jobId}`, "retries", 1);
};

const getProcessingJobs = async (): Promise<string[]> => {
  return redis.lrange(PROCESSING_LIST, 0, -1);
};

const cleanupJob = async (jobId: string): Promise<void> => {
  await redis.del(`${JOB_HASH_PREFIX}${jobId}`);
};

export {
  pushJob,
  popJob,
  acquireLock,
  renewLock,
  releaseLock,
  updateJobProgress,
  getJobFromRedis,
  removeFromProcessing,
  incrementRetry,
  getProcessingJobs,
  cleanupJob,
  WAITING_LIST,
  PROCESSING_LIST,
  JOB_HASH_PREFIX,
};
