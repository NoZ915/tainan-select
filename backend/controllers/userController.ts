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

    if (name && name.length > 10) {
      res.status(400).json({ message: "暱稱不得超過 10 個字" });
      return;
    }

    const userName = await UserService.updateUser(user_id, name);
    res.status(200).json(userName);
  } catch (err: any) {
    if (err instanceof Error && err.message === "NAME_ALREADY_EXISTS") {
      res.status(409).json({ message: "名稱已被使用" });
      return;
    }
    if (err?.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({ message: "名稱已被使用" });
      return;
    }
    res.status(500).json({ message: err });
  }
}
