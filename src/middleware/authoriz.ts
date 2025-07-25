import { Request, Response, NextFunction } from 'express';
import {configurations} from "../utils/tools";
import jwt from "jsonwebtoken";
import {AuthReq, Role} from "../models/modeles"

export function authorize(allowedRoles: Role[]) {
    return (req: AuthReq, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).send('No token provided');

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).send('No token found');

        try {
            const payload = jwt.verify(token, configurations.jwt.secret) as {
                userId: number;
                role: Role;
            };

            if (!allowedRoles.includes(payload.role)) {
                return res.status(403).send('Forbidden: insufficient rights');
            }

            req.user = payload;
            next();
        } catch (err) {
            return res.status(401).send('Invalid token');
        }
    };
}
