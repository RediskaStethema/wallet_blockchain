import TronWeb from 'tronweb';
import { adminService } from '../../src/services/AdminServices.js';
import * as modeles from '../../src/models/modeles.js'; // импортируем весь модуль для enum и pool
import bcrypt from 'bcrypt';
import { createToken } from '../../src/utils/tools.js';

jest.mock('../../src/models/modeles.js', () => {
    const originalModule = jest.requireActual('../../src/models/modeles.js');
    return {
        __esModule: true,
        ...originalModule,
        pool: {
            query: jest.fn()
        }
    };
});

jest.mock('bcrypt', () => ({
    hash: jest.fn(async () => 'hashed-password')
}));

jest.mock('../../src/utils/tools.js', () => ({
    createToken: jest.fn(() => 'mocked-token')
}));

const tronWebMock = {
    trx: {
        getBalance: jest.fn()
    }
};

const service = new adminService(tronWebMock as any);

const { pool, Role, TransactionStatus } = modeles;  // достаём нужные экспорты

describe('adminService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getAllUsers: returns list of users', async () => {
        (pool.query as jest.Mock).mockResolvedValue([[{ id: 1 }, { id: 2 }]]);

        const result = await service.getAllUsers();

        expect(pool.query).toHaveBeenCalledWith('SELECT id, email, created_at FROM users');
        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    test('getUserById: returns user if found', async () => {
        const user = { id: 1, email: 'a@b.com', created_at: new Date() };
        (pool.query as jest.Mock).mockResolvedValue([[user]]);

        const result = await service.getUserById(1);

        expect(pool.query).toHaveBeenCalledWith(
            'SELECT id, email, created_at FROM users WHERE id = ?',
            [1]
        );
        expect(result).toEqual(user);
    });

    test('getUserById: throws error if user not found', async () => {
        (pool.query as jest.Mock).mockResolvedValue([[]]);

        await expect(service.getUserById(999)).rejects.toThrow('User not found');
    });

    test('deleteUser: calls delete query', async () => {
        (pool.query as jest.Mock).mockResolvedValue([{}]);

        await service.deleteUser(1);

        expect(pool.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [1]);
    });

    test('updateUserRole: calls update query', async () => {
        (pool.query as jest.Mock).mockResolvedValue([{}]);

        await service.updateUserRole(1, Role.ADMIN);

        expect(pool.query).toHaveBeenCalledWith('UPDATE users SET role = ? WHERE id = ?', [Role.ADMIN, 1]);
    });

    test('getAllWallets: returns wallets', async () => {
        const wallets = [{ id: 1, user_id: 2, address: 'addr', created_at: new Date() }];
        (pool.query as jest.Mock).mockResolvedValue([wallets]);

        const result = await service.getAllWallets();

        expect(pool.query).toHaveBeenCalledWith('SELECT id, user_id, address, created_at FROM wallets');
        expect(result).toEqual(wallets);
    });

    test('getWalletsByUser: returns wallets by user', async () => {
        const wallets = [{ id: 1, address: 'addr', created_at: new Date() }];
        (pool.query as jest.Mock).mockResolvedValue([wallets]);

        const result = await service.getWalletsByUser(1);

        expect(pool.query).toHaveBeenCalledWith(
            'SELECT id, address, created_at FROM wallets WHERE user_id = ?',
            [1]
        );
        expect(result).toEqual(wallets);
    });

    test('getWalletBalance: converts balance from SUN to TRX', async () => {
        tronWebMock.trx.getBalance.mockResolvedValue(123456789);

        const result = await service.getWalletBalance('address');

        expect(tronWebMock.trx.getBalance).toHaveBeenCalledWith('address');
        expect(result).toBeCloseTo(123.456789);
    });

    test('getAllTransactions: returns transactions', async () => {
        const txs = [{ id: 1, tx_id: 'tx123', amount: 10, status: 'completed', created_at: new Date(), wallet: 'addr' }];
        (pool.query as jest.Mock).mockResolvedValue([txs]);

        const result = await service.getAllTransactions();

        expect(pool.query).toHaveBeenCalledWith(
            `SELECT t.id, t.tx_id, t.amount, t.status, t.created_at, w.address AS wallet
       FROM transactions t
       JOIN wallets w ON t.wallet_id = w.id`
        );
        expect(result).toEqual(txs);
    });

    test('getTransactionsByUser: returns transactions by user', async () => {
        const txs = [{ id: 1, tx_id: 'tx123', amount: 10, status: 'pending', created_at: new Date() }];
        (pool.query as jest.Mock).mockResolvedValue([txs]);

        const result = await service.getTransactionsByUser(1);

        expect(pool.query).toHaveBeenCalledWith(
            `SELECT t.id, t.tx_id, t.amount, t.status, t.created_at 
       FROM transactions t
       JOIN wallets w ON t.wallet_id = w.id
       WHERE w.user_id = ?`,
            [1]
        );
        expect(result).toEqual(txs);
    });

    test('updateTransactionStatus: calls update query', async () => {
        (pool.query as jest.Mock).mockResolvedValue([{}]);

        await service.updateTransactionStatus('tx123', TransactionStatus.Confirmed);

        expect(pool.query).toHaveBeenCalledWith('UPDATE transactions SET status = ? WHERE tx_id = ?', [
            TransactionStatus.Confirmed,
            'tx123'
        ]);
    });

    test('registerAdmin: throws error if user exists', async () => {
        (pool.query as jest.Mock).mockResolvedValue([[{ id: 1 }]]);

        await expect(service.registerAdmin('a@b.com', 'password')).rejects.toThrow('User already exists');
    });

    test('registerAdmin: inserts new admin and returns token', async () => {
        (pool.query as jest.Mock)
            // check user exists
            .mockResolvedValueOnce([[]])
            // insert user
            .mockResolvedValueOnce([{ insertId: 42 }]);

        const result = await service.registerAdmin('a@b.com', 'password');

        expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
        expect(pool.query).toHaveBeenCalledWith(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            ['a@b.com', 'hashed-password', Role.ADMIN]
        );
        expect(createToken).toHaveBeenCalledWith(42, Role.ADMIN);
        expect(result).toEqual({
            id: 42,
            email: 'a@b.com',
            role: Role.ADMIN,
            token: 'mocked-token'
        });
    });
});
