import { JobStatus } from "@prisma/client";

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
}

export interface JobResultResponse {
  jobId: string;
  wordCount: number;
  paragraphCount: number;
  topKeywords: string[];
}

export interface ProcessedFileData {
  wordCount: number;
  paragraphCount: number;
  topKeywords: string[];
}
