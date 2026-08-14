import express, { Router } from "express";
import passport from "passport";
import { generateJwtToken } from "../utils/jwt";
import { checkAuthStatus, logoutController, statusController } from "../controllers/authController";
import {
  cancelOAuthAttempt,
  completeOAuthAttempt,
  failClaimedOAuthAttempt,
  getOAuthOwner,
  getOAuthStateCookieName,
  getOAuthStateCookieOptions,
  isOAuthStartRateLimited,
} from "../utils/oauthStateStore";

const router: Router = express.Router();
const isProd = process.env.NODE_ENV === "production";

// google oAuth + passport
router.get(
  "/google",
  (req, res, next) => {
    if (!getOAuthOwner(req)) {
      res.status(400).json({ message: "無效的 OAuth 登入識別碼" });
      return;
    }

    if (isOAuthStartRateLimited(req.ip ?? "")) {
      res.status(429).json({ message: "登入請求過於頻繁，請稍後再試。" });
      return;
    }

    passport.authenticate("google", {
      scope: ["email", "profile"],
      prompt: "select_account", // 這個參數會強制 Google 彈出選擇帳號的視窗
    })(req, res, next);
  },
);
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    if (err || !user) {
      const stateHash = (
        req as typeof req & { oauthStateClaimed?: boolean }
      ).oauthStateClaimed
        ? failClaimedOAuthAttempt(state)
        : null;
      if (stateHash) {
        res.clearCookie(
          getOAuthStateCookieName(stateHash),
          getOAuthStateCookieOptions(),
        );
      }

      // 若發生錯誤或無使用者，導向錯誤頁
      const error = info?.message === "invalid_oauth_state"
        ? "invalid_oauth_state"
        : req.query.error === "access_denied"
          ? "oauth_cancelled"
          : "invalid_email";
      res.redirect(
        `${process.env.FRONTEND_BASE_URL}/auth/google/callback?error=${error}`
      );
      return;
    }

    const jwtToken = generateJwtToken(user);
    if (!state || !completeOAuthAttempt(state)) {
      res.redirect(
        `${process.env.FRONTEND_BASE_URL}/auth/google/callback?error=invalid_oauth_state`
      );
      return;
    }

    // 產生 JWT 並存入 Cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.FRONTEND_BASE_URL}/auth/google/callback`);
  })(req, res, next);
});

router.post("/google/cancel", (req, res) => {
  const owner = typeof req.body?.owner === "string" ? req.body.owner : "";
  const result = cancelOAuthAttempt(owner);
  if (result.stateHash) {
    res.clearCookie(
      getOAuthStateCookieName(result.stateHash),
      getOAuthStateCookieOptions(),
    );
  }
  res.json({ status: result.status });
});

// 驗證登入狀態
router.get("/status", statusController);
router.get("/checkStatus", checkAuthStatus);

// 登出
router.post("/logout", logoutController);

export default router;
