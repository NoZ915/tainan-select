import express, { Router } from "express";
import passport from "passport";
import { generateJwtToken } from "../utils/jwt";

const router: Router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }, (req, res) => {
    console.log(req);
    const user = req.user;
    const jwtToken = generateJwtToken(user);

    // 存入 Cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });

    res.redirect(`${process.env.FRONTEND_BASE_URL}/`);
  })
);

export default router;
