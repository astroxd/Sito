import { Request, Response, NextFunction } from "express";
import { SharedList } from "../models/sharedList.model";

export const checkSharedListAccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sharedListId = req.params.listId;

  if (!sharedListId) {
    return res
      .status(400)
      .json({ message: "Access denied. Malformed request" });
  }

  const userId = res.locals.userId;

  try {
    const userRole = SharedList.getUserRole(Number(sharedListId), userId);

    if (!userRole) {
      return res.status(403).json({ message: "Access denied. Not a member" });
    }

    res.locals.userRole = userRole.role;
    next();
  } catch (error) {
    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};
