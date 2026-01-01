import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "your-super-secret-jwt-key";
}

export function generateAccessToken(userId: string, email: string): string {
  const payload: JwtPayload = { userId, email };
  // Set expiration to 200 years in the future (approximately 6,307,200,000 seconds)
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 200);
  const expiresInSeconds = Math.floor((expirationDate.getTime() - Date.now()) / 1000);
  
  return jwt.sign(payload, getJwtSecret(), { expiresIn: expiresInSeconds } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}
