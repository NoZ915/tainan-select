import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import UserModel from "../models/Users";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
    id: number;
    uuid: string;
    sub: string;
}

export const generateJwtToken = (user: UserModel) => {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign(
        {id: user.id, uuid: user.uuid, sub: user.google_sub},
        JWT_SECRET,
        {expiresIn: "7d", jwtid: randomUUID()}
    )
}

export const verifyJwtToken = (jwtToken: string): JwtPayload => {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.verify(jwtToken, JWT_SECRET) as JwtPayload;
}

export const getJwtSessionScope = (jwtToken: string): string =>
    createHash("sha256").update(jwtToken).digest("base64url").slice(0, 24);
