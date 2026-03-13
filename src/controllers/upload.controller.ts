import { saveFile } from "../services/file.service.js";
import { createJob } from "../services/job.service.js";
import { pushJob } from "../services/queue.service.js";
import type { Request, Response } from "express";
import { ZodUser } from "../zod/index.js";
import { db } from "../lib/prisma.js";

const uploadFile = async (req: Request, res: Response) => {
  try {
    const { success, data } = ZodUser.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        message: "user's email and name is required",
        success: false,
      });
    }
    if (!req.file) {
      return res.status(400).json({
        message: "file is required",
        succes: false,
      });
    }
    const user = await db.user.upsert({
      where: {
        email: data.email,
      },
      update: {},
      create: {
        name: data.name,
        email: data.email,
      },
    });
    const file = await saveFile(
      user.id,
      req.file.path,
      req.file.originalname,
      req.file.size,
      req.file.mimetype,
    );
    const job = await createJob(file.id);
    await pushJob(job.id);
    return res.status(201).json({
      message: "file uploaded successfully",
      jobId: job.id,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: "internal server error",
      success: false,
    });
  }
};

export { uploadFile };
