import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PUBLIC_ROUTES } from "../routes";

const JTWSECRET = process.env.JWT_SECRET || "RSAPRIVATE";

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
    return res.status(401).json({ message: "Access deniend. Missing token" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access deniend. Malformed token" });
  }

  try {
    const decodedToken = jwt.verify(token, JTWSECRET) as {
      userId: number;
    };

    req.headers["x-user-id"] = decodedToken.userId.toString();

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
