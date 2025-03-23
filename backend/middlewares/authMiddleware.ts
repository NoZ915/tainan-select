import { RequestHandler } from "express";
import { verifyJwtToken } from "../utils/jwt.js";

export const authenticateJWT: RequestHandler = (req, res, next): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyJwtToken(token);
    req.user = decoded; // 將解碼的 payload 添加到 req.user
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};
