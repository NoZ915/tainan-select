import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { getJwtSessionScope, verifyJwtToken } from "../utils/jwt";
import userService from "../services/userService";

export const statusController: RequestHandler = async (
  req,
  res
): Promise<void> => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ message: "未登入" });
    return;
  }

  let userDetail;
  try {
    userDetail = verifyJwtToken(token);
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ authenticated: false, message: "驗證失敗" });
      return;
    }

    console.error("登入驗證設定異常:", err);
    res.status(500).json({ message: "無法確認登入狀態" });
    return;
  }

  try {
    const user = await userService.getUserByGoogleSub(userDetail.sub);
    if (!user) {
      res.status(404).json({ authenticated: false, message: "用戶未找到" });
      return;
    }
    const { id, name, detail, avatar, is_admin, created_at, updated_at } = user;
    res.status(200).json({
      authenticated: true,
      session_scope: getJwtSessionScope(token),
      user: {
        id,
        name,
        detail,
        avatar,
        is_admin,
        created_at,
        updated_at,
      },
    });
  } catch (err) {
    console.error("讀取登入使用者失敗:", err);
    res.status(500).json({ message: "無法確認登入狀態" });
  }
};

// 單純用來確認cookie還在不在的
export const checkAuthStatus: RequestHandler = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.json({ authenticated: false });
    return;
  }

  let userDetail;
  try {
    userDetail = verifyJwtToken(token);
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.json({ authenticated: false });
      return;
    }

    console.error("登入驗證設定異常:", err);
    res.status(500).json({ message: "無法確認登入狀態" });
    return;
  }

  try {
    const user = await userService.getUserByGoogleSub(userDetail.sub);
    if (!user) {
      res.json({ authenticated: false });
      return;
    }

    const { id, name, detail, avatar, is_admin, created_at, updated_at } = user;
    res.json({
      authenticated: true,
      session_scope: getJwtSessionScope(token),
      user: {
        id,
        name,
        detail,
        avatar,
        is_admin,
        created_at,
        updated_at,
      },
    });
  } catch (err) {
    console.error("讀取登入使用者失敗:", err);
    res.status(500).json({ message: "無法確認登入狀態" });
  }
};

export const logoutController: RequestHandler = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/", 
  });
  res.json({ message: "已登出" });
};
