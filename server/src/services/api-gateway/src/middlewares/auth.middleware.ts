import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, "../config/.env"),
});

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PUBLIC_ROUTES } from "../routes";

const JTW_SECRET = process.env.JWT_SECRET || "RSAPRIVATE";

const isPublicRoute = (req: Request) => {
  const fullPath = req.originalUrl.split("?")[0];
  return PUBLIC_ROUTES.some((r) => fullPath === r.url);
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (isPublicRoute(req)) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. Missing token" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. Malformed token" });
  }

  try {
    const decodedToken = jwt.verify(token, JTW_SECRET) as {
      userId: number;
    };

    req.headers["x-user-id"] = decodedToken.userId.toString();

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
