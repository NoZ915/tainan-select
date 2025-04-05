import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface User extends JwtPayload {
      user_id: number;
      email: string;
    }
  }
}
