import { UserService } from '../../src/services/UserService.js';
import { pool, Role } from '../../src/models/modeles.js';
import bcrypt from 'bcrypt';
import {TronWeb} from 'tronweb';
import { jest } from '@jest/globals';

jest.mock('../../src/models/modeles.js', () => ({
    pool: {
        query: jest.fn(),
    },
    Role: {
        USER: 'USER',
        ADMIN: 'ADMIN',
    }
}));

jest.mock('bcrypt');

const tronWebMock = {
    createAccount: jest.fn(),
} as unknown as TronWeb

describe('UserService', () => {
    let service: UserService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new UserService(tronWebMock);
    });

    test('register success', async () => {
        // @ts-ignore
        (pool.query as jest.Mock).mockResolvedValueOnce([[]]); // user not exists
        // @ts-ignore
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
        // @ts-ignore
        (pool.query as jest.Mock).mockResolvedValueOnce([{ insertId: 1 }]);

        // Мок для createToken (если нужно, можно замокать из tools)
        // Но в тесте достаточно проверить, что вернулся объект с token
        const result = await service.register('test@example.com', 'password');

        expect(pool.query).toHaveBeenCalledWith('SELECT id FROM users WHERE email = ?', ['test@example.com']);
        expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
        expect(pool.query).toHaveBeenCalledWith(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            ['test@example.com', 'hashedPassword', Role.USER]
        );
        expect(result).toHaveProperty('token');
    });

    test('register throws if user exists', async () => {
        // @ts-ignore
        (pool.query as jest.Mock).mockResolvedValueOnce([[{ id: 1 }]]);

        await expect(service.register('test@example.com', 'password')).rejects.toThrow('User already exists');
    });

    test('login success', async () => {
        // @ts-ignore
        (pool.query as jest.Mock).mockResolvedValueOnce([[{ id: 1, password: 'hashed', role: Role.USER }]]);
        // @ts-ignore
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await service.login('test@example.com', 'password');

        expect(pool.query).toHaveBeenCalledWith('SELECT id, password, role FROM users WHERE email = ?', ['test@example.com']);
        expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed');
        expect(result).toHaveProperty('token');
    });

    test('login throws if user not found', async () => {
        // @ts-ignore
        (pool.query as jest.Mock).mockResolvedValueOnce([[]]);
        await expect(service.login('test@example.com', 'password')).rejects.toThrow('User not found');
    });

    test('login throws if password invalid', async () => {
        // @ts-ignore
        (pool.query as jest.Mock).mockResolvedValueOnce([[{ id: 1, password: 'hashed', role: Role.USER }]]);
        // @ts-ignore
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        await expect(service.login('test@example.com', 'wrongpass')).rejects.toThrow('Invalid password');
    });

    test('getProfile success', async () => {
        // @ts-ignore
        (pool.query as jest.Mock).mockResolvedValueOnce([[{ id: 1, email: 'test@example.com', created_at: new Date() }]]);

        const result = await service.getProfile(1);

        expect(pool.query).toHaveBeenCalledWith('SELECT id, email, created_at FROM users WHERE id = ?', [1]);
        expect(result).toMatchObject({ id: 1, email: 'test@example.com' });
    });

    test('getProfile throws if user not found', async () => {
        // @ts-ignore
        (pool.query as jest.Mock).mockResolvedValueOnce([[]]);
        await expect(service.getProfile(1)).rejects.toThrow('User not found');
    });

    test('createWallet success', async () => {
        const fakeWallet = { address: { base58: 'fakeaddress' } };

        // @ts-ignore
        (pool.query as jest.Mock).mockResolvedValueOnce([{ insertId: 10 }]); // insert wallet
        // @ts-ignore
        (pool.query as jest.Mock).mockResolvedValueOnce([[{ id: 10, address: 'fakeaddress', created_at: new Date() }]]); // select wallet

        const result = await service.createWallet(1);

        expect(tronWebMock.createAccount).toHaveBeenCalled();
        expect(pool.query).toHaveBeenCalledWith('INSERT INTO wallets (user_id, address) VALUES (?, ?)', [1, 'fakeaddress']);
        expect(result).toHaveProperty('address', 'fakeaddress');
    });



});
