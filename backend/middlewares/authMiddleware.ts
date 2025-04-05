import { RequestHandler } from "express";
import { verifyJwtToken } from "../utils/jwt.js";

export const authenticateJWT: RequestHandler = (req, res, next): void => {
  const authHeader = req.headers.authorization;
  let token = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    // 先從 Authorization header找token
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    // 如果沒有Authrization header，再從cookie去找token
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const decoded = verifyJwtToken(token);
    req.user = decoded; // 將解碼的 payload 添加到 req.user
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};
