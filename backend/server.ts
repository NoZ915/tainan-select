import "dotenv/config";
import cors from "cors";
import express, { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import passport from 'passport';
import "./utils/passport";
import db from "./models";

import authRoutes from "./routes/auth"
import coursesRoutes from "./routes/courses";
import reviewsRoutes from "./routes/reviews";
import interestsRoutes from "./routes/interests";

const app: Express = express();
const corsOptions = {
  origin: process.env.FRONTEND_BASE_URL, // 設置允許的來源
  credentials: true, // 允許帶有憑證的請求
};

// middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// routes
app.use("/api/auth", authRoutes)
app.use("/api/courses", coursesRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/interests", interestsRoutes);

const startServer = async (): Promise<void> => {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected");
    await db.sequelize.sync(); // 同步資料庫
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
