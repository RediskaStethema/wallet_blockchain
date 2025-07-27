import {configurations} from "../utils/tools.js";
import {PaymentStatus} from "../models/modeles.js";


export class PaymentController {
    async createOrder(userId: number, amount: number) {
        return configurations.service_payment.createOrder(userId, amount);
    }

    async createWalletForOrder(orderId: number) {
        return configurations.service_payment.createWalletForOrder(orderId);
    }

    async getAllOrders(status?: PaymentStatus) {
        return configurations.service_payment.getAllOrders(status);
    }

    async getOrderById(orderId: number) {
        return configurations.service_payment.getOrderById(orderId);
    }

    async getWalletByOrder(orderId: number) {
        return configurations.service_payment.getWalletByOrder(orderId);
    }

    async getWalletBalance(address: string) {
        return configurations.service_payment.getWalletBalance(address);
    }

    async cancelOrder(orderId: number) {
        return configurations.service_payment.cancelOrder(orderId);
    }

    async confirmTransaction(txId: string) {
        return configurations.service_payment.confirmTransaction(txId);
    }

    async checkIncomingPayments(address: string) {
        return configurations.service_payment.checkIncomingPayments(address);
    }

    async updateOrderStatus(orderId: number, status: PaymentStatus) {
        return configurations.service_payment.updateOrderStatus(orderId, status);
    }

    async notify(orderId: number) {
        return configurations.service_payment.notify(orderId);
    }

    async pollIncomingTransactions() {
        return configurations.service_payment.pollIncomingTransactions();
    }
}