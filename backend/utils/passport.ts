import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userService from "../services/userService";
import whitelistService from "../services/whitelistService";

function normalizeEmail(email: unknown) {
  return String(email ?? "").trim().toLowerCase();
}

function isSchoolDomain(email: string) {
  const allowed = String(process.env.ALLOWED_EMAIL_DOMAIN ?? "").trim().toLowerCase();
  const emailDomain = email.split("@")[1] ?? "";
  return emailDomain === allowed;
}

passport.use(
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.BACKEND_BASE_URL}/auth/google/callback`,
  },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const sub = profile?._json?.sub ?? profile?.id;
        const email = normalizeEmail(profile?._json?.email);

        if (!sub) {
          return done(null, false);
        }

        const schoolOk = isSchoolDomain(email);

        let whitelistRow = null;
        if (!schoolOk) {
          whitelistRow = await whitelistService.getWhitelistByEmail(email);
          if (!whitelistRow) {
            return done(null, false);
          }
        }

        let user = await userService.getUserByGoogleSub(sub);
        if (!user) {
          user = await userService.createUser(sub, whitelistRow?.id ?? null);
        }

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    })
)
