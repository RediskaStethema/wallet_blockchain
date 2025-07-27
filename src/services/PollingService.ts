import WebSocket, { Server as WebSocketServer } from 'ws';
import {IPollingService} from "../models/modeles.js";
import {PaymentService} from "./PaymentService.js";


export class PollingService implements IPollingService {
    private intervalId?: NodeJS.Timeout;
    private paymentService: PaymentService;
    private wss: WebSocketServer;

    constructor(paymentService: PaymentService, wss: WebSocketServer) {
        this.paymentService = paymentService;
        this.wss = wss;
    }

    startPolling(intervalMs = 15000) {
        if (this.intervalId) return;
        this.intervalId = setInterval(async () => {
            try {
                const newPayments = await this.paymentService.pollIncomingTransactions();

                if (newPayments && newPayments.length > 0) {
                    for (const payment of newPayments) {

                        this.wss.clients.forEach(client => {

                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    type: 'payment_received',
                                    data: payment,
                                }));
                            }
                        });
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }, intervalMs);
    }

    stopPolling() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }
}
