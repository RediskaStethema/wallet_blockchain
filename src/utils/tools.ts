import {Config} from "../models/modeles";
import {UserService} from "../services/UserService";
import {adminService} from "../services/AdminServices";
import {tronWeb} from "../config/configurs";
import {PaymentService} from "../services/PaymentService";
import crypto from 'crypto';

export const  configurations:Config= {
    service_payment: new PaymentService(tronWeb),
    service_acc: new  UserService(tronWeb),
    service_admin: new adminService(tronWeb),
    jwt:{
        secret:process.env.JWT_SECRET || "super-secret-key",
        exp:process.env.JWT_EXP || "1h",
    }
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