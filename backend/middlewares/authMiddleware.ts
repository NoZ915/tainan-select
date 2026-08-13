import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { getJwtSessionScope, verifyJwtToken } from "../utils/jwt.js";

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
    const expectedSessionScope = req.header("x-expected-session-scope");
    if (
      expectedSessionScope
      && expectedSessionScope !== `session:${getJwtSessionScope(token)}`
    ) {
      res.status(409).json({
        code: "SESSION_CHANGED",
        message: "登入帳號已變更，請重新開始操作",
      });
      return;
    }
    req.user = decoded; // 將解碼的 payload 添加到 req.user
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    console.error("登入驗證設定異常:", err);
    res.status(500).json({ error: "無法確認登入狀態" });
  }
};

// 單純用來確認是否存在token這個cookie
export const getCookie: RequestHandler = (req, res, next): void => {
  const authHeader = req.headers.authorization;
  let token = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    // 先從 Authorization header找token
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    // 如果沒有Authrization header，再從cookie去找token
    token = req.cookies.token;
  }

  try {
    if(token !== ""){
      const decoded = verifyJwtToken(token);
      req.user = decoded; // 將解碼的 payload 添加到 req.user
    }else{
      req.user = undefined;
    }
    
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      req.user = undefined;
      next();
      return;
    }

    console.error("登入驗證設定異常:", err);
    res.status(500).json({ error: "無法確認登入狀態" });
  }
};
