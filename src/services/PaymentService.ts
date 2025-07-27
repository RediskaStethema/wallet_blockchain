import {DataWall, IPaymentService, OrderData, PaymentData, PaymentStatus, pool} from "../models/modeles.js";
import TronWeb from "tronweb";
import axios from 'axios';
import {encryptPrivateKey, USDT_CONTRACT} from "../utils/tools.js";





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

        const account = await this.tronWeb.createAccount();
        const walletAddress = account.address.base58;
        const privateKey = account.privateKey;


        const encryptedPrivateKey = encryptPrivateKey(privateKey);


        const [result] = await pool.query(
            "INSERT INTO wallets (order_id, address, private_key, created_at) VALUES (?, ?, ?, NOW())",
            [orderId, walletAddress, encryptedPrivateKey]
        );
        const walletId = (result as any).insertId;


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

    async pollIncomingTransactions(): Promise<PaymentData[]> {
        const newPayments: PaymentData[] = [];
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

                    const [existing] = await pool.query(
                        "SELECT id FROM payments WHERE tx_id = ?",
                        [txId]
                    );
                    if ((existing as any[]).length > 0) continue;

                    const amount = parseFloat(event.result.value) / 1e6;

                    const [insertResult] = await pool.query(
                        "INSERT INTO payments (address, tx_id, amount, status, created_at) VALUES (?, ?, ?, ?, NOW())",
                        [wallet.address, txId, amount, PaymentStatus.Pending]
                    );

                    const insertId = (insertResult as any).insertId;

                    // Получаем полный PaymentData вставленной записи
                    const [rows] = await pool.query(
                        "SELECT id, wallet_id AS walletId, tx_id AS txId, amount, status, created_at AS createdAt FROM payments WHERE id = ?",
                        [insertId]
                    );
                    const payment = (rows as PaymentData[])[0];

                    if (payment) {
                        newPayments.push(payment);
                    }


                }
            } catch (err) {
                console.error(`Ошибка при опросе кошелька ${wallet.address}:`, err);
            }
        }

        return newPayments;
    }






}
