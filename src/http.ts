import "dotenv/config";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import express, { type Express } from "express";
import { router } from "./routes/index.js";
import helmet from "helmet";

const createHttp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  app.use("/api", router);
  app.use(errorMiddleware);
  return app;
};

export { createHttp };
