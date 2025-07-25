import {AuthReq} from "../models/modeles";
import {configurations} from "../utils/tools";
import {Response} from "express"
import {UpdateProfileDto} from "../models/types";


export class UserController {
    // Регистрация
    async register(email: string, password: string) {
        return configurations.service_acc.register(email, password);
    }

    // Логин
    async login(email: string, password: string) {
        return configurations.service_acc.login(email, password);
    }

    // Получить профиль
    async getProfile(userId: number) {
        return configurations.service_acc.getProfile(userId);
    }

    // Обновить профиль
    async updateProfile(userId: number, data: Partial<UpdateProfileDto>) {
        return configurations.service_acc.updateProfile(userId, data);
    }

    // Сменить пароль
    async changePassword(userId: number, oldPass: string, newPass: string) {
        return configurations.service_acc.changePassword(userId, oldPass, newPass);
    }

    // Создать кошелек
    async createWallet(userId: number) {
        return configurations.service_acc.createWallet(userId);
    }

    // Получить кошельки пользователя
    async getWallets(userId: number) {
        return configurations.service_acc.getWallets(userId);
    }

    // Получить транзакции пользователя
    async getTransactions(userId: number) {
        return configurations.service_acc.getTransactions(userId);
    }

    // Удалить аккаунт
    async deleteAccount(userId: number) {
        return configurations.service_acc.deleteAccount(userId);
    }
}
