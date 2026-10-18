import "dotenv/config";
import cors from "cors";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import passport from 'passport';
import path from "path";
import { fileURLToPath } from "url";
import "./utils/passport";
import type { RuntimeConfig } from "./config/runtime";

import authRoutes from "./routes/auth"
import coursesRoutes from "./routes/courses";
import reviewsRoutes from "./routes/reviews";
import interestsRoutes from "./routes/interests";
import usersRoutes from "./routes/users";
import statsRoutes from "./routes/stats";
import semestersRoutes from "./routes/semesters";
import timetablesRoutes from "./routes/timetables";
import reactionsRoutes from "./routes/reactions";
import adminRoutes from "./routes/admin";
import featureRequestsRoutes from "./routes/featureRequests";
import timetableAnalyticsRoutes from "./routes/timetableAnalytics";

export const createApp = (config: RuntimeConfig): Express => {
  const app: Express = express();
  app.set("trust proxy", config.trustProxyHops);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const corsOptions = {
    origin: config.frontendBaseUrl, // 僅允許指定前端來源
    credentials: true, // 允許帶有憑證的請求
  };

  // 中介層
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json());
  app.use(passport.initialize());
  app.use("/reactions", express.static(path.join(__dirname, "public", "reactions")));

  app.get("/health", (_req, res) => {
    res.set("Cache-Control", "no-store").status(200).json({ status: "ok" });
  });

  // 頭貼
  const avatarDir = path.resolve(__dirname, "public", "avatars");
  app.use("/avatars", express.static(avatarDir));

  // 路由
  app.use("/api/auth", authRoutes)
  app.use("/api/courses", coursesRoutes);
  app.use("/api/reviews", reviewsRoutes);
  app.use("/api/interests", interestsRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/stats", statsRoutes);
  app.use("/api/reactions", reactionsRoutes);
  app.use("/api/semesters", semestersRoutes);
  app.use("/api/timetables", timetablesRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/feature-requests", featureRequestsRoutes);
  app.use("/api/timetable-analytics", timetableAnalyticsRoutes);

  return app;
};
