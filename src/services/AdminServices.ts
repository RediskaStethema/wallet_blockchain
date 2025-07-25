import {IAdminService, pool, Role, TransactionStatus} from "../models/modeles";
import {TransactionData, UserProfile, WalletData} from "../models/types";
import TronWeb from "tronweb";



export class adminService implements IAdminService {

    private tronWeb: TronWeb;

    constructor(tronWebInstance: TronWeb) {
        this.tronWeb = tronWebInstance;
    }

    async getAllUsers(): Promise<UserProfile[]> {
        const [rows] = await pool.query('SELECT id, email, created_at FROM users');
        return rows as UserProfile[];
    }

    async getUserById(userId: number): Promise<UserProfile> {
        const [rows] = await pool.query(
            'SELECT id, email, created_at FROM users WHERE id = ?',
            [userId]
        );
        const user = (rows as UserProfile[])[0];
        if (!user) throw new Error('User not found');
        return user;
    }

    async deleteUser(userId: number): Promise<void> {
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    }

    async updateUserRole(userId: number, role: Role): Promise<void> {
        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    }


    async getAllWallets(): Promise<WalletData[]> {
        const [rows] = await pool.query('SELECT id, user_id, address, created_at FROM wallets');
        return rows as WalletData[];
    }

    async getWalletsByUser(userId: number): Promise<WalletData[]> {
        const [rows] = await pool.query(
            'SELECT id, address, created_at FROM wallets WHERE user_id = ?',
            [userId]
        );
        return rows as WalletData[];
    }

    async getWalletBalance(address: string): Promise<number> {
        const sun = await this.tronWeb.trx.getBalance(address); // returns in SUN (1e6)
        return sun / 1e6;
    }


    async getAllTransactions(): Promise<TransactionData[]> {
        const [rows] = await pool.query(
            `SELECT t.id, t.tx_id, t.amount, t.status, t.created_at, w.address AS wallet
       FROM transactions t
       JOIN wallets w ON t.wallet_id = w.id`
        );
        return rows as TransactionData[];
    }

    async getTransactionsByUser(userId: number): Promise<TransactionData[]> {
        const [rows] = await pool.query(
            `SELECT t.id, t.tx_id, t.amount, t.status, t.created_at 
       FROM transactions t
       JOIN wallets w ON t.wallet_id = w.id
       WHERE w.user_id = ?`,
            [userId]
        );
        return rows as TransactionData[];
    }

    async updateTransactionStatus(txId: string, status: TransactionStatus): Promise<void> {
        await pool.query('UPDATE transactions SET status = ? WHERE tx_id = ?', [status, txId]);
    }
}
