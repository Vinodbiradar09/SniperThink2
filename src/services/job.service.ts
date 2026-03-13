import { db } from "../lib/prisma.js";
import { JobStatus } from "@prisma/client";

const createJob = async (fileId: string) => {
  await db.job.create({
    data: {
      fileId,
      status: JobStatus.PENDING,
      progress: 0,
    },
  });
};

const updateJobStatus = async (
  jobId: string,
  status: JobStatus,
  progress: number,
  errorMsg?: string,
) => {
  return db.job.update({
    where: {
      id: jobId,
    },
    data: {
      status,
      progress,
      ...(errorMsg && { errorMsg }),
    },
  });
};

const incrementJobRetry = async (jobId: string) => {
  return db.job.update({
    where: {
      id: jobId,
    },
    data: {
      retryCount: { increment: 1 },
    },
  });
};

const getJobStatus = async (jobId: string) => {
  return db.job.findUnique({
    where: {
      id: jobId,
    },
    select: {
      id: true,
      progress: true,
      status: true,
    },
  });
};

const getJobWithFile = async (jobId: string) => {
  return db.job.findUnique({
    where: {
      id: jobId,
    },
    include: {
      file: true,
    },
  });
};

const markJobFailed = async (jobId: string, errorMsg: string) => {
  return db.job.update({
    where: {
      id: jobId,
    },
    data: {
      status: JobStatus.FAILED,
      errorMsg,
      progress: 0,
    },
  });
};

export {
  createJob,
  updateJobStatus,
  incrementJobRetry,
  getJobStatus,
  getJobWithFile,
  markJobFailed,
};
