import {DataWall, IPaymentService, OrderData, PaymentData, PaymentStatus, pool} from "../models/modeles";
import TronWeb from "tronweb";
import axios from 'axios';
import {encryptPrivateKey} from "../utils/tools";

const USDT_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'


export class PaymentService implements IPaymentService {
    private tronWeb: TronWeb;

    constructor(tronWebInstance: TronWeb) {
        this.tronWeb = tronWebInstance;
    }
    async cancelOrder(orderId: number): Promise<void> {
        await pool.query("UPDATE orders SET status = ? WHERE id = ?", [
            PaymentStatus.Cancelled,
            orderId,
        ]);
    }

    async checkIncomingPayments(address: string): Promise<PaymentData[]> {
        const [rows] = await pool.query(
            `SELECT id, tx_id, amount, status, created_at FROM payments WHERE address = ? AND status = ?`,
            [address, PaymentStatus.Pending]
        );
        return rows as PaymentData[];
    }

    async confirmTransaction(txId: string): Promise<void> {
        await pool.query("UPDATE payments SET status = ? WHERE tx_id = ?", [
            PaymentStatus.Confirmed,
            txId,
        ]);
    }

    async createOrder(userId: number, amount: number): Promise<OrderData> {
        const [result] = await pool.query(
            "INSERT INTO orders (user_id, amount, status) VALUES (?, ?, ?)",
            [userId, amount, PaymentStatus.Pending]
        );
        const insertResult = result as any;
        const orderId = insertResult.insertId;

        const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [
            orderId,
        ]);
        return (rows as OrderData[])[0];
    }

    async createWalletForOrder(orderId: number): Promise<DataWall> {
        // 1. Генерация аккаунта TRON
        const account = await this.tronWeb.createAccount();
        const walletAddress = account.address.base58;
        const privateKey = account.privateKey;

        // 2. Шифрование приватного ключа
        const encryptedPrivateKey = encryptPrivateKey(privateKey);

        // 3. Сохранение в БД
        const [result] = await pool.query(
            "INSERT INTO wallets (order_id, address, private_key, created_at) VALUES (?, ?, ?, NOW())",
            [orderId, walletAddress, encryptedPrivateKey]
        );
        const walletId = (result as any).insertId;

        // 4. Получение и возврат
        const [rows] = await pool.query("SELECT * FROM wallets WHERE id = ?", [walletId]);
        return (rows as DataWall[])[0];
    }

    async getAllOrders(status?: PaymentStatus): Promise<OrderData[]> {
        if (status) {
            const [rows] = await pool.query("SELECT * FROM orders WHERE status = ?", [
                status,
            ]);
            return rows as OrderData[];
        } else {
            const [rows] = await pool.query("SELECT * FROM orders");
            return rows as OrderData[];
        }
    }

    async getOrderById(orderId: number): Promise<OrderData> {
        const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [
            orderId,
        ]);
        const order = (rows as OrderData[])[0];
        if (!order) throw new Error("Order not found");
        return order;
    }

    async getWalletBalance(address: string): Promise<number> {
        const sun = await this.tronWeb.trx.getBalance(address); // баланс в SUN (1e6)
        return sun / 1e6;
    }

    async getWalletByOrder(orderId: number): Promise<DataWall | null> {
        const [rows] = await pool.query(
            "SELECT * FROM wallets WHERE order_id = ? LIMIT 1",
            [orderId]
        );
        return (rows as DataWall[])[0] || null;
    }

    async updateOrderStatus(orderId: number, status: PaymentStatus): Promise<void> {
        await pool.query("UPDATE orders SET status = ? WHERE id = ?", [
            status,
            orderId,
        ]);
    }

    async notify(orderId: number): Promise<void> {
        const order = await this.getOrderById(orderId);
        await axios.post('https://your-api.com/payment/confirmed', {
            orderId,
            amount: order.amount,
            status: order.status,
        }).catch((err) => {
            console.error('Webhook error:', err.message);
        });
    }

    async pollIncomingTransactions(): Promise<void> {
        const [wallets] = await pool.query("SELECT * FROM wallets");

        for (const wallet of wallets as DataWall[]) {
            try {
                const events = await this.tronWeb.getEventResult(USDT_CONTRACT, {
                    eventName: 'Transfer',
                    fromBlock: 0,
                    toBlock: 'latest',
                    filter: {
                        to: wallet.address,
                    },
                    onlyConfirmed: true,
                });

                for (const event of events) {
                    const txId = event.transaction_id;
                    const amount = parseFloat(event.result.value) / 1e6;

                    // Проверка, существует ли уже эта транзакция в базе
                    const [existing] = await pool.query(
                        "SELECT id FROM payments WHERE tx_id = ?",
                        [txId]
                    );
                    if ((existing as any[]).length > 0) continue;

                    // Сохранение новой входящей транзакции как Pending
                    await pool.query(
                        "INSERT INTO payments (address, tx_id, amount, status, created_at) VALUES (?, ?, ?, ?, NOW())",
                        [wallet.address, txId, amount, PaymentStatus.Pending]
                    );

                    // Получение связанного заказа
                    if (!wallet.orderId) {
                        console.warn(`Wallet ${wallet.address} не привязан к заказу.`);
                        continue;
                    }
                    const order = await this.getOrderById(wallet.orderId);

                    // Проверка, достаточно ли средств для подтверждения
                    if (amount >= order.amount) {
                        await this.confirmTransaction(txId);
                        await this.updateOrderStatus(order.id, PaymentStatus.Confirmed);
                        await this.notify(order.id);
                    }

                    console.log(`💰 Обнаружен входящий платеж ${amount} USDT → ${wallet.address}`);
                }
            } catch (err) {
                console.error(`Ошибка при опросе кошелька ${wallet.address}:`, err);
            }
        }
    }





}
