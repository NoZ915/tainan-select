import { RequestHandler } from "express";
import { verifyJwtToken } from "../utils/jwt";
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

  try {
    const userDetail = verifyJwtToken(token);
    const user = await userService.getUserByGoogleSub(userDetail.sub);
    if (!user) {
      res.status(404).json({ authenticated: false, message: "用戶未找到" });
      return;
    }
    const { name, detail, avatar, created_at, updated_at } = user;
    res.status(200).json({
      authenticated: true,
      user: {
        name,
        detail,
        avatar,
        created_at,
        updated_at,
      },
    });
  } catch (err) {
    res.status(401).json({ authenticated: false, message: "驗證失敗" });
  }
};

// 單純用來確認cookie還在不在的
export const checkAuthStatus: RequestHandler = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.json({ authenticated: false });
    return;
  }

  try {
    const userDetail = verifyJwtToken(token);
    const user = await userService.getUserByGoogleSub(userDetail.sub);
    if (!user) {
      res.json({ authenticated: false });
      return;
    }

    res.json({ authenticated: true, user: { name: user.name, avatar: user.avatar } });
  } catch (err) {
    res.json({ authenticated: false });
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
