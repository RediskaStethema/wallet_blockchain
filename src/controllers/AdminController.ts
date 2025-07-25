import {configurations} from "../utils/tools";
import {Role, TransactionStatus} from "../models/modeles";

export class AdminController {
    // Получить всех пользователей
    async getAllUsers() {
        return configurations.service_admin.getAllUsers();
    }

    // Получить пользователя по ID
    async getUserById(userId: number) {
        return configurations.service_admin.getUserById(userId);
    }

    // Удалить пользователя по ID
    async deleteUser(userId: number) {
        return configurations.service_admin.deleteUser(userId);
    }

    // Обновить роль пользователя
    async updateUserRole(userId: number, role: Role) {
        return configurations.service_admin.updateUserRole(userId, role);
    }

    // Получить все кошельки
    async getAllWallets() {
        return configurations.service_admin.getAllWallets();
    }

    // Получить кошельки конкретного пользователя
    async getWalletsByUser(userId: number) {
        return configurations.service_admin.getWalletsByUser(userId);
    }

    // Получить баланс кошелька
    async getWalletBalance(address: string) {
        return configurations.service_admin.getWalletBalance(address);
    }

    // Получить все транзакции
    async getAllTransactions() {
        return configurations.service_admin.getAllTransactions();
    }

    // Получить транзакции пользователя
    async getTransactionsByUser(userId: number) {
        return configurations.service_admin.getTransactionsByUser(userId);
    }

    // Обновить статус транзакции
    async updateTransactionStatus(txId: string, status: TransactionStatus) {
        return configurations.service_admin.updateTransactionStatus(txId, status);
    }
}
