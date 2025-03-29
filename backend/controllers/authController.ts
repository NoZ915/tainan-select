import { RequestHandler } from "express";
import { verifyJwtToken } from "../utils/jwt";

export const statusController: RequestHandler = (req, res) => {
    const token = req.cookies.token;
    if(!token){
        res.status(401).json({ message: "未登入" })
    }

    try{
        const userDetail = verifyJwtToken(token);
        res.status(200).json({ authenticated: true, userDetail });
    }catch(err){
        res.status(401).json({ authenticated: false, message: "驗證失敗" });
    }
}

export const logoutController: RequestHandler = (req, res) => {
    res.clearCookie("token");
    res.json({ message: "已登出" })
}