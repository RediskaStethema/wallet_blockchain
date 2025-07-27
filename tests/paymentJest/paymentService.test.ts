import { PaymentService } from '../../src/services/PaymentService.js';
import * as modeles from '../../src/models/modeles.js';
import TronWeb from 'tronweb';
import axios from 'axios';
import * as tools from '../../src/utils/tools.js';

jest.mock('../../src/models/modeles.js', () => {
    const originalModule = jest.requireActual('../../src/models/modeles.js');
    return {
        __esModule: true,
        ...originalModule,
        pool: {
            query: jest.fn(),
        },
    };
});

jest.mock('axios');
jest.mock('../../src/utils/tools.js');

const tronWebMock = {
    trx: {
        getBalance: jest.fn(),
    },
    createAccount: jest.fn(),
    getEventResult: jest.fn(),
};

const { pool, PaymentStatus } = modeles;

describe('PaymentService', () => {
    let service: PaymentService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PaymentService(tronWebMock as any);
    });

    test('cancelOrder calls correct query', async () => {
        (pool.query as jest.Mock).mockResolvedValue([{}]);
        await service.cancelOrder(5);
        expect(pool.query).toHaveBeenCalledWith('UPDATE orders SET status = ? WHERE id = ?', [
            PaymentStatus.Cancelled,
            5,
        ]);
    });

    test('checkIncomingPayments returns payments with status Pending', async () => {
        const payments = [{ id: 1, tx_id: 'tx1', amount: 100, status: PaymentStatus.Pending, created_at: new Date() }];
        (pool.query as jest.Mock).mockResolvedValue([payments]);

        const result = await service.checkIncomingPayments('addr1');

        expect(pool.query).toHaveBeenCalledWith(
            'SELECT id, tx_id, amount, status, created_at FROM payments WHERE address = ? AND status = ?',
            ['addr1', PaymentStatus.Pending]
        );
        expect(result).toEqual(payments);
    });

    test('confirmTransaction calls correct query', async () => {
        (pool.query as jest.Mock).mockResolvedValue([{}]);
        await service.confirmTransaction('tx123');
        expect(pool.query).toHaveBeenCalledWith('UPDATE payments SET status = ? WHERE tx_id = ?', [
            PaymentStatus.Confirmed,
            'tx123',
        ]);
    });

    test('createOrder inserts order and returns it', async () => {
        const insertedId = 99;
        const order = { id: insertedId, user_id: 1, amount: 50, status: PaymentStatus.Pending, created_at: new Date() };

        (pool.query as jest.Mock)
            .mockResolvedValueOnce([{ insertId: insertedId }]) // insert
            .mockResolvedValueOnce([[order]]); // select

        const result = await service.createOrder(1, 50);

        expect(pool.query).toHaveBeenNthCalledWith(1,
            'INSERT INTO orders (user_id, amount, status) VALUES (?, ?, ?)',
            [1, 50, PaymentStatus.Pending]
        );

        expect(pool.query).toHaveBeenNthCalledWith(2,
            'SELECT * FROM orders WHERE id = ?',
            [insertedId]
        );

        expect(result).toEqual(order);
    });

    test('createWalletForOrder creates account, encrypts key, inserts wallet and returns it', async () => {
        const orderId = 123;
        const accountMock = {
            address: { base58: 'address123' },
            privateKey: 'privateKey123',
        };
        const walletFromDb = {
            id: 11,
            order_id: orderId,
            address: 'address123',
            private_key: 'encryptedKey',
            created_at: new Date(),
        };

        tronWebMock.createAccount.mockResolvedValue(accountMock);
        (tools.encryptPrivateKey as jest.Mock).mockReturnValue('encryptedKey');
        (pool.query as jest.Mock)
            .mockResolvedValueOnce([{ insertId: walletFromDb.id }]) // insert
            .mockResolvedValueOnce([[walletFromDb]]); // select

        const result = await service.createWalletForOrder(orderId);

        expect(tronWebMock.createAccount).toHaveBeenCalled();
        expect(tools.encryptPrivateKey).toHaveBeenCalledWith(accountMock.privateKey);
        expect(pool.query).toHaveBeenNthCalledWith(1,
            'INSERT INTO wallets (order_id, address, private_key, created_at) VALUES (?, ?, ?, NOW())',
            [orderId, accountMock.address.base58, 'encryptedKey']
        );
        expect(pool.query).toHaveBeenNthCalledWith(2,
            'SELECT * FROM wallets WHERE id = ?',
            [walletFromDb.id]
        );

        expect(result).toEqual(walletFromDb);
    });

    test('getAllOrders returns all orders if no status', async () => {
        const orders = [{ id: 1, status: PaymentStatus.Pending }, { id: 2, status: PaymentStatus.Confirmed }];
        (pool.query as jest.Mock).mockResolvedValue([orders]);

        const result = await service.getAllOrders();

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM orders');
        expect(result).toEqual(orders);
    });

    test('getAllOrders returns filtered orders if status provided', async () => {
        const orders = [{ id: 2, status: PaymentStatus.Confirmed }];
        (pool.query as jest.Mock).mockResolvedValue([orders]);

        const result = await service.getAllOrders(PaymentStatus.Confirmed);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM orders WHERE status = ?', [PaymentStatus.Confirmed]);
        expect(result).toEqual(orders);
    });

    test('getOrderById returns order if found', async () => {
        const order = { id: 3, status: PaymentStatus.Pending };
        (pool.query as jest.Mock).mockResolvedValue([[order]]);

        const result = await service.getOrderById(3);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM orders WHERE id = ?', [3]);
        expect(result).toEqual(order);
    });

    test('getOrderById throws if order not found', async () => {
        (pool.query as jest.Mock).mockResolvedValue([[]]);
        await expect(service.getOrderById(999)).rejects.toThrow('Order not found');
    });

    test('getWalletBalance returns balance in TRX', async () => {
        tronWebMock.trx.getBalance.mockResolvedValue(5000000); // 5 TRX

        const result = await service.getWalletBalance('addr');

        expect(tronWebMock.trx.getBalance).toHaveBeenCalledWith('addr');
        expect(result).toBe(5);
    });

    test('getWalletByOrder returns wallet or null', async () => {
        const wallet = { id: 1, order_id: 123, address: 'addr' };
        (pool.query as jest.Mock).mockResolvedValue([[wallet]]);

        const result = await service.getWalletByOrder(123);
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM wallets WHERE order_id = ? LIMIT 1', [123]);
        expect(result).toEqual(wallet);

        (pool.query as jest.Mock).mockResolvedValue([[]]);
        const resultNull = await service.getWalletByOrder(999);
        expect(resultNull).toBeNull();
    });

    test('updateOrderStatus calls update query', async () => {
        (pool.query as jest.Mock).mockResolvedValue([{}]);
        await service.updateOrderStatus(3, PaymentStatus.Confirmed);
        expect(pool.query).toHaveBeenCalledWith('UPDATE orders SET status = ? WHERE id = ?', [PaymentStatus.Confirmed, 3]);
    });

    test('notify sends post request and catches error', async () => {
        const order = { id: 5, amount: 100, status: PaymentStatus.Confirmed };
        jest.spyOn(service, 'getOrderById').mockResolvedValue(order as any);
        (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

        await service.notify(5);
        expect(axios.post).toHaveBeenCalledWith('https://your-api.com/payment/confirmed', {
            orderId: 5,
            amount: order.amount,
            status: order.status,
        });
    });

    test('notify logs error on axios failure', async () => {
        const order = { id: 5, amount: 100, status: PaymentStatus.Confirmed };
        jest.spyOn(service, 'getOrderById').mockResolvedValue(order as any);
        (axios.post as jest.Mock).mockRejectedValue(new Error('fail'));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await service.notify(5);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Webhook error:', 'fail');

        consoleErrorSpy.mockRestore();
    });

    test('pollIncomingTransactions processes wallets and inserts new payments', async () => {
        const wallets = [{ id: 1, address: 'addr1' }];
        (pool.query as jest.Mock).mockResolvedValueOnce([wallets]); // get wallets

        const events = [
            {
                transaction_id: 'tx1',
                result: { value: '1000000' },
            },
        ];
        tronWebMock.getEventResult.mockResolvedValue(events);

        // No existing payment with tx1
        (pool.query as jest.Mock)
            .mockResolvedValueOnce([[]]) // check existing payment by tx_id
            .mockResolvedValueOnce([{ insertId: 1 }]) // insert payment
            .mockResolvedValueOnce([[{
                id: 1,
                walletId: 1,
                txId: 'tx1',
                amount: 1,
                status: PaymentStatus.Pending,
                createdAt: new Date(),
            }]]); // select inserted payment

        const payments = await service.pollIncomingTransactions();

        expect(pool.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM wallets');
        expect(tronWebMock.getEventResult).toHaveBeenCalledWith(
            'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj',
            expect.objectContaining({
                eventName: 'Transfer',
                fromBlock: 0,
                toBlock: 'latest',
                filter: { to: 'addr1' },
                onlyConfirmed: true,
            })
        );
        expect(pool.query).toHaveBeenNthCalledWith(2, 'SELECT id FROM payments WHERE tx_id = ?', ['tx1']);
        expect(pool.query).toHaveBeenNthCalledWith(
            3,
            'INSERT INTO payments (address, tx_id, amount, status, created_at) VALUES (?, ?, ?, ?, NOW())',
            ['addr1', 'tx1', 1, PaymentStatus.Pending]
        );
        expect(pool.query).toHaveBeenNthCalledWith(
            4,
            'SELECT id, wallet_id AS walletId, tx_id AS txId, amount, status, created_at AS createdAt FROM payments WHERE id = ?',
            [1]
        );

        expect(payments).toHaveLength(1);
        expect(payments[0].txId).toBe('tx1');
    });

    test('pollIncomingTransactions logs error but continues', async () => {
        const wallets = [{ id: 1, address: 'addr1' }];
        (pool.query as jest.Mock).mockResolvedValueOnce([wallets]); // get wallets

        const error = new Error('fail');
        tronWebMock.getEventResult.mockRejectedValue(error);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const payments = await service.pollIncomingTransactions();

        expect(tronWebMock.getEventResult).toHaveBeenCalledWith(
            'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj',
            expect.objectContaining({
                eventName: 'Transfer',
                fromBlock: 0,
                toBlock: 'latest',
                filter: { to: 'addr1' },
                onlyConfirmed: true,
            })
        );

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'pollIncomingTransactions error for address addr1:',
            error
        );

        expect(payments).toEqual([]); // Ошибка была, но функция не упала

        consoleErrorSpy.mockRestore();
    });
});

