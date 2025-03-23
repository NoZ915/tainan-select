import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userService from "../services/userService";

passport.use(
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.FRONTEND_BASE_URL}/auth/google/callback`,
  }, 
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const { sub, email } = profile;

      if (!email?.endsWith('@gm2.nutn.edu.tw')) {
        return done(null, false, { message: 'Email domain not allowed' });
      }

      let user = await userService.getUserByGoogleSub(sub);
      if(!user){
        user = await userService.createUser(sub);
      }

      done(null, user);
    } catch (err) {
      done(err, false);
    }
  })
)
