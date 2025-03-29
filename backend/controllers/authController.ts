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

export const logoutController: RequestHandler = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "已登出" });
};
