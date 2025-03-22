import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
passport.use(
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.FRONTEND_BASE_URL}/auth/google/callback`,
    scope: ['profile'],
  }, 
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const { sub } = profile;
      done(null, profile);
    } catch (err) {
      done(err, false);
    }
  })
)
