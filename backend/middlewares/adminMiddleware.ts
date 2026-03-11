import { RequestHandler } from "express";
import UserService from "../services/userService";

export const authenticateAdmin: RequestHandler = async (req, res, next): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const user = await UserService.getUserById(req.user.id);
    if (!user?.is_admin) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  } catch (error) {
    console.error("authenticateAdmin failed:", error);
    res.status(500).json({ message: "驗證管理員權限失敗" });
  }
};
