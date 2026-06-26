import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JTWSECRET = process.env.JWT_SECRET || "RSAPRIVATE";

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
    const decodedToken = jwt.verify(token, JTWSECRET) as {
      userId: number;
    };

    res.locals.userId = decodedToken.userId;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
