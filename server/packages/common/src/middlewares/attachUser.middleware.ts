import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export const attachUserHeader = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.headers["x-user-id"] as string;

  if (userId) {
    const parsedId = Number(userId);

    if (!isNaN(parsedId)) {
      req.userId = parsedId;
    }
  }

  next();
};
