import "dotenv/config";
import express, { type Express } from "express";
import helmet from "helmet";

const createHttp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  // here we will use the routes
  // app.use("/api/upload" , routes);
  return app;
};

export { createHttp };
