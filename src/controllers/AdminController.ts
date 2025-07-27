import {configurations} from "../utils/tools.js";
import {Role, TransactionStatus} from "../models/modeles.js";

export class AdminController {

    async getAllUsers() {
        return configurations.service_admin.getAllUsers();
    }


    async getUserById(userId: number) {
        return configurations.service_admin.getUserById(userId);
    }


    async deleteUser(userId: number) {
        return configurations.service_admin.deleteUser(userId);
    }


    async updateUserRole(userId: number, role: Role) {
        return configurations.service_admin.updateUserRole(userId, role);
    }


    async getAllWallets() {
        return configurations.service_admin.getAllWallets();
    }


    async getWalletsByUser(userId: number) {
        return configurations.service_admin.getWalletsByUser(userId);
    }


    async getWalletBalance(address: string) {
        return configurations.service_admin.getWalletBalance(address);
    }


    async getAllTransactions() {
        return configurations.service_admin.getAllTransactions();
    }


    async getTransactionsByUser(userId: number) {
        return configurations.service_admin.getTransactionsByUser(userId);
    }


    async updateTransactionStatus(txId: string, status: TransactionStatus) {
        return configurations.service_admin.updateTransactionStatus(txId, status);
    }

    async registerAdmin(email: string, password: string) {
        return  await configurations.service_admin.registerAdmin(email, password);
    }
}
