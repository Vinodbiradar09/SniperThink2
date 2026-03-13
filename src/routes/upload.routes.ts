import { uploadFile } from "../controllers/upload.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { Router } from "express";

const uploadRouter = Router();
uploadRouter.post("/", upload.single("file"), uploadFile);

export { uploadRouter };
