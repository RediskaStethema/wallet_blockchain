import {IUserService, pool, Role} from "../models/modeles.js";
import {TransactionData, UpdateProfileDto, UserProfile, WalletData} from "../models/types.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {configurations, createToken} from "../utils/tools.js";
import TronWeb from 'tronweb';

export class UserService implements IUserService {
    private tronWeb: TronWeb;

    constructor(tronWebInstance: TronWeb) {
        this.tronWeb = tronWebInstance;
    }
    async register(email: string, password: string): Promise<{ token: string }> {
        const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if ((exists as any[]).length > 0) throw new Error('User already exists');

        const hash = await bcrypt.hash(password, 10);


        const [result] = await pool.query(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hash, Role.USER]
        );

        const insertResult = result as any;
        const userId = insertResult.insertId;

        const token = createToken(userId, Role.USER);
        return { token };
    }

    async login(email: string, password: string): Promise<{ token: string }> {
        const [rows] = await pool.query('SELECT id, password, role FROM users WHERE email = ?', [email]);
        const user = (rows as any[])[0];
        if (!user) throw new Error('User not found');

        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new Error('Invalid password');

        const token = createToken(user.id, user.role as Role)

        return { token };
    }

    async getProfile(userId: number): Promise<UserProfile> {
        const [rows] = await pool.query('SELECT id, email, created_at FROM users WHERE id = ?', [userId]);
        const user = (rows as any[])[0];
        if (!user) throw new Error('User not found');

        return {
            id: user.id,
            email: user.email,
            createdAt: user.created_at,
        };
    }

    async createWallet(userId: number): Promise<WalletData> {

        const wallet = await this.tronWeb.createAccount()
        const address = wallet.address.base58;

        const [result] = await pool.query(
            'INSERT INTO wallets (user_id, address) VALUES (?, ?)',
            [userId, address]
        );

        const insertResult = result as any;
        const walletId = insertResult.insertId;

        const [walletRows] = await pool.query(
            'SELECT id, address, created_at FROM wallets WHERE id = ?',
            [walletId]
        );

        return (walletRows as WalletData[])[0];
    }

    async getWallets(userId: number): Promise<WalletData[]> {
        const [rows] = await pool.query(
            'SELECT id, address, created_at FROM wallets WHERE user_id = ?',
            [userId]
        );
        return rows as WalletData[];
    }

    async getTransactions(userId: number): Promise<TransactionData[]> {
        const [rows] = await pool.query(
            `SELECT t.id, t.tx_id, t.amount, t.status, t.created_at 
       FROM transactions t
       JOIN wallets w ON t.wallet_id = w.id
       WHERE w.user_id = ?`,
            [userId]
        );
        return rows as TransactionData[];
    }

    async updateProfile(userId: number, data: Partial<UpdateProfileDto>): Promise<UserProfile> {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.email) {
            fields.push('email = ?');
            values.push(data.email);
        }
        if (data.username) {
            fields.push('username = ?');
            values.push(data.username);
        }

        if (fields.length === 0) throw new Error('Nothing to update');

        values.push(userId);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        await pool.query(query, values);

        return await this.getProfile(userId);
    }

    async changePassword(userId: number, oldPass: string, newPass: string): Promise<void> {
        const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
        const user = (rows as any[])[0];
        if (!user) throw new Error('User not found');

        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) throw new Error('Old password is incorrect');

        const hash = await bcrypt.hash(newPass, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
    }

    async deleteAccount(userId: number): Promise<void> {
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    }
}