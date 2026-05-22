import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const RSA_PUBLIC_KEY = process.env.RSA_PUBLIC_KEY || "RSAPRIVATE";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access deniend. Missing token" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access deniend. Malformed token" });
  }

  try {
    const decodedToken = jwt.verify(token, RSA_PUBLIC_KEY) as {
      userId: number;
    };

    res.locals.userId = decodedToken.userId;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
