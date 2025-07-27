import { Response, NextFunction } from 'express';

import {AuthReq, Role, Rule} from "../models/modeles.js"
import {match} from "path-to-regexp"

export function authorize(pathRoles: Record<string, string[]>) {

    const rules: Rule[] = Object.entries(pathRoles).map(([key, roles]) => {
        const [method, rawPath] = key.split(' ');
        return {
            method,
            matchFn: match(rawPath, { decode: decodeURIComponent }),
            roles: roles as Role[],
            original: key,
        };
    });

    return (req: AuthReq, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        const reqMethod = req.method;
        const reqPath = req.baseUrl + req.path;

        const matchedRule = rules.find(rule =>
            rule.method === reqMethod && rule.matchFn(reqPath)
        );

        if (!matchedRule) {
            return next();
        }

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: no token' });
        }

        const hasRole = matchedRule.roles.includes(user.role);
        if (!hasRole) {
            return res.status(403).json({ message: 'Forbidden: insufficient rights' });
        }

        next();
    };
}