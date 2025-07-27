import { AuthReq, Role } from "../models/modeles.js";
import { RequestHandler, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {BEARER, configurations} from "../utils/tools.js";

export function Authent(config: { jwtSecret: string }): RequestHandler {
    return (req: AuthReq, res: Response, next: NextFunction) => {
        const fullPath = `${req.method} ${req.baseUrl}${req.path}`.replace(/\/+$/, "");

        if (configurations.paths_skips.includes(fullPath)) {
            return next();
        }
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith(`${BEARER}`)) {
            return res.status(401).json({ message: "No token auth" });
        }

        const token = authHeader.split(" ")[1];

        try {
            const payload = jwt.verify(token, config.jwtSecret) as { userId: number; role: string };
            req.user = { userId: payload.userId, role: payload.role as Role };
            next();
        } catch {
            return res.status(401).json({ message: "Wrong token" });
        }
    };
}