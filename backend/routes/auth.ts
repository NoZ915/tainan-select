import express, { Router } from "express";
import passport from "passport";
import { generateJwtToken } from "../utils/jwt";

const router: Router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err || !user) {
      // 若發生錯誤或無使用者，導向錯誤頁
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/auth/google/callback?error=invalid_email`);
    }

    // 產生 JWT 並存入 Cookie
    const jwtToken = generateJwtToken(user);
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.redirect(`${process.env.FRONTEND_BASE_URL}/`);
  })(req, res, next);
});

export default router;
