"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachUserHeader = void 0;
const attachUserHeader = (req, res, next) => {
    const userId = req.headers["x-user-id"];
    if (userId) {
        const parsedId = Number(userId);
        if (!isNaN(parsedId)) {
            req.userId = parsedId;
        }
    }
    next();
};
exports.attachUserHeader = attachUserHeader;
