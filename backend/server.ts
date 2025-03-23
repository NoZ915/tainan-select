import "dotenv/config";
import cors from "cors";
import express, { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import passport from 'passport';
import "./utils/passport";
import db from "./models";

import coursesRoutes from "./routes/courses";
import authRoutes from "./routes/auth"

const app: Express = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// routes
app.use("/api/auth", authRoutes)
app.use("/api/courses", coursesRoutes);

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
