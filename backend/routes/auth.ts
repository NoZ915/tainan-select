import express, { Router } from "express";
import passport from "passport";
import { generateJwtToken } from "../utils/jwt";
import { checkAuthStatus, logoutController, statusController } from "../controllers/authController";

const router: Router = express.Router();

// google oAuth + passport
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
    prompt: 'select_account', // 這個參數會強制 Google 彈出選擇帳號的視窗
  })
);
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err || !user) {
      // 若發生錯誤或無使用者，導向錯誤頁
      return res.redirect(
        `${process.env.FRONTEND_BASE_URL}/auth/google/callback?error=invalid_email`
      );
    }

    // 產生 JWT 並存入 Cookie
    const jwtToken = generateJwtToken(user);
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.redirect(`${process.env.FRONTEND_BASE_URL}/auth/google/callback`);
  })(req, res, next);
});

// 驗證登入狀態
router.get("/status", statusController);
router.get("/checkStatus", checkAuthStatus);

// 登出
router.post("/logout", logoutController);

export default router;
