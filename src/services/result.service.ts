import { db } from "../lib/prisma.js";

const saveResult = async (
  jobId: string,
  wordCount: number,
  paragraphCount: number,
  keywords: string[],
) => {
  return db.result.create({
    data: {
      jobId,
      wordCount,
      paragraphCount,
      keywords,
    },
  });
};

const getResultByJobId = async (jobId: string) => {
  return db.result.findUnique({
    where: {
      jobId,
    },
    select: {
      jobId: true,
      wordCount: true,
      paragraphCount: true,
      keywords: true,
    },
  });
};

export { saveResult, getResultByJobId };
