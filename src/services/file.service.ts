import { db } from "../lib/prisma.js";

const saveFile = async (
  userId: string,
  filePath: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
) => {
  return db.file.create({
    data: {
      userId,
      filePath,
      fileName,
      fileSize,
      mimeType,
    },
  });
};

const getFileById = async (fileId: string) => {
  return db.file.findUnique({
    where: {
      id: fileId,
    },
  });
};

export { saveFile, getFileById };
