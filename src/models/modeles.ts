import {AdminEmp, TransactionData, UpdateProfileDto, UserProfile, WalletData} from "./types.js";
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import {UserService} from "../services/UserService.js";
import {adminService} from "../services/AdminServices.js";
import {Request} from "express";
import Joi from "joi";
import {PaymentService} from "../services/PaymentService.js";
import {match} from "path-to-regexp";
dotenv.config();

export const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email должен быть валидным',
        'string.empty': 'Email обязателен',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Пароль должен быть не менее 6 символов',
        'string.empty': 'Пароль обязателен',
    }),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email должен быть валидным',
        'string.empty': 'Email обязателен',
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Пароль обязателен',
    }),
});

export const updateProfileSchema = Joi.object({
    email: Joi.string().email().optional().messages({
        'string.email': 'Email должен быть валидным',
    }),
    username: Joi.string().min(3).max(30).optional().messages({
        'string.min': 'Имя должно быть не менее 3 символов',
        'string.max': 'Имя должно быть не более 30 символов',
    }),
}).min(1).messages({
    'object.min': 'Должно быть хотя бы одно поле для обновления',
});

export const changePasswordSchema = Joi.object({
    oldPass: Joi.string().required().messages({
        'string.empty': 'Старый пароль обязателен',
    }),
    newPass: Joi.string().min(6).required().messages({
        'string.min': 'Новый пароль должен быть не менее 6 символов',
        'string.empty': 'Новый пароль обязателен',
    }),
});

export enum Role{
    ADMIN="ADMIN",
    USER="USER",
}

export interface Rule {
    method: string;
    matchFn: ReturnType<typeof match>;
    roles: Role[];
    original: string;
}


export enum TransactionStatus {
    Pending = 'pending',
    Confirmed = 'confirmed',
    Failed = 'failed',
}

export enum PaymentStatus {
    Pending = 'pending',
    Confirmed = 'confirmed',
    Failed = 'failed',
    Cancelled = 'cancelled',
}

export interface IPollingService {
    startPolling(intervalMs?: number): void;
    stopPolling(): void;
}

export interface DataWall {
    id: number;
    userId?: number;
    orderId?: number;
    address: string;
    privateKey: string;   // 🔐 зашифрованный приватный ключ (например, AES)
    createdAt: Date;
}

export interface PaymentData {
    id: number;
    walletId: number;
    txId: string;
    amount: number;
    status: PaymentStatus;
    createdAt: Date;
}

export interface OrderData {
    id: number;
    userId: number;
    walletId?: number;
    amount: number;
    status: PaymentStatus;
    createdAt: Date;
    updatedAt?: Date;
}

export interface AuthReq extends Request {
    user?: {
        userId: number;
        role: Role;
    };
}

export interface IPaymentService {
    createOrder(userId: number, amount: number): Promise<OrderData>;
    createWalletForOrder(orderId: number): Promise<DataWall>;

    checkIncomingPayments(address: string): Promise<PaymentData[]>;
    confirmTransaction(txId: string): Promise<void>;
    pollIncomingTransactions(): Promise<PaymentData[]>;

    cancelOrder(orderId: number): Promise<void>;
    updateOrderStatus(orderId: number, status: PaymentStatus): Promise<void>;

    getWalletByOrder(orderId: number): Promise<DataWall | null>;
    getWalletBalance(address: string): Promise<number>;

    getOrderById(orderId: number): Promise<OrderData>;
    getAllOrders(status?: PaymentStatus): Promise<OrderData[]>;

    notify(orderId: number): Promise<void>;
}

export interface IUserService {
    register(email: string, password: string): Promise<{ token: string }>;
    login(email: string, password: string): Promise<{ token: string }>;
    getProfile(userId: number): Promise<UserProfile>;


    createWallet(userId: number): Promise<WalletData>;
    getWallets(userId: number): Promise<WalletData[]>;


    getTransactions(userId: number): Promise<TransactionData[]>;


    updateProfile(userId: number, data: Partial<UpdateProfileDto>): Promise<UserProfile>;
    changePassword(userId: number, oldPass: string, newPass: string): Promise<void>;
    deleteAccount(userId: number): Promise<void>;
}

export interface IAdminService {
    getAllUsers(): Promise<UserProfile[]>;
    getUserById(userId: number): Promise<UserProfile>;
    deleteUser(userId: number): Promise<void>;
    updateUserRole(userId: number, role: Role): Promise<void>; // если реализована роль

    getAllWallets(): Promise<WalletData[]>;
    getWalletsByUser(userId: number): Promise<WalletData[]>;
    getWalletBalance(walletAddress: string): Promise<number>;

    getAllTransactions(): Promise<TransactionData[]>;
    getTransactionsByUser(userId: number): Promise<TransactionData[]>;
    updateTransactionStatus(txId: string, status: TransactionStatus): Promise<void>;
    registerAdmin(email: string, password: string):Promise<AdminEmp>;
}

export interface Config {
    paths_skips:string[],
    pathroles:Record<string, string[]>
    service_payment: PaymentService,
    service_acc: UserService
    service_admin: adminService
    jwt: {
        secret: string,
        exp: string
    }

}

export interface RegisterDto {
    email: string;
    password: string;
}

export const pool=mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});




