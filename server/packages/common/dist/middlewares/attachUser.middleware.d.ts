import { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            userId?: number;
        }
    }
}
export declare const attachUserHeader: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=attachUser.middleware.d.ts.map