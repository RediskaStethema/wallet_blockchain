import { Request, Response} from 'express';
import crypto from 'crypto';
import {AuthReq, Config, Role} from "../models/modeles.js";
import {PaymentService} from "../services/PaymentService.js";
import {UserService} from "../services/UserService.js";
import {adminService} from "../services/AdminServices.js";
import {tronWeb} from "../config/configurs_trones.js";
import {NextFunction} from "express";
import appconfs from "../../configures/config.json" with {type:"json"}
import jwt from "jsonwebtoken";

export const BEARER = 'Bearer ';
export const USDT_CONTRACT =process.env.USDT_CONTR;

export const  configurations:Config= {
    ...appconfs,
    service_payment: new PaymentService(tronWeb),
    service_acc: new  UserService(tronWeb),
    service_admin: new adminService(tronWeb),
    jwt:{
        secret:process.env.JWT_SECRET || "super-secret-key",
        exp:process.env.JWT_EXP || "1h",
    }
}


export function createToken(userId: number, role: Role): string {
    return jwt.sign(
        { userId, role },
        configurations.jwt.secret,
        { expiresIn: '7d' }
    );
}

const ENCRYPTION_KEY = process.env.SECRET_KEY!.slice(0, 32); // ключ должен быть 32 байта
const IV_LENGTH = 16;

 export function encryptPrivateKey(privateKey: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

export const skiprouts = (skips: string[]) => {
    return (req: AuthReq, res: Response, next: NextFunction) => {
        const pathmethod = `${req.method} ${req.path}`;
        console.log('Checking skip:', pathmethod);

        if (skips.includes(pathmethod)) {
            return next('route');
        }

        next();
    };
};