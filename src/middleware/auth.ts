import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AuthRequest, JwtPayload } from "../types";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const headers = req.headers as any;
  const authHeader = headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Access token is required" });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload: JwtPayload = verifyAccessToken(token);
    (req as AuthRequest).user = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired access token" });
  }
}
