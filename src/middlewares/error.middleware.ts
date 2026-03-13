import type { Request, Response, NextFunction } from "express";
import multer from "multer";

const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "File size exceeds 10MB limit" });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.message === "Only PDF and TXT files are allowed") {
    res.status(400).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};

export { errorMiddleware };
