import express, { type Express } from "express";
import adminRoutes from "./routes/admin.routes";
import "./cron/monitor";

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/admin", adminRoutes);
  return app;
}

const app = createApp();

export default app;
