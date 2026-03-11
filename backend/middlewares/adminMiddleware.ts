import { RequestHandler } from "express";
import UserService from "../services/userService";

export const authenticateAdmin: RequestHandler = async (req, res, next): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await UserService.getUserById(req.user.id);
  if (!user?.is_admin) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
};
