import "dotenv/config";
import cors from "cors";
import express, { Express, Request, Response, NextFunction } from "express";
import db from "./models";

import coursesRoutes from "./routes/courses";

const app: Express = express();
app.use(cors());
app.use(express.json());

// middleware
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next();
});

// routes
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
