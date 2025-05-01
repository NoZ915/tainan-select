import { RequestHandler } from "express";
import UserService from "../services/userService";

export const updateUser: RequestHandler = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user_id = req.user.id;
    const { name } = req.body;

    await UserService.updateUser(user_id, name);
    res.status(200).json({ message: "Update user successful" });
  } catch (err) {
    res.status(500).json({ message: err });
  }
}