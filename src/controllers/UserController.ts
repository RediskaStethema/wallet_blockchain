import {AuthReq} from "../models/modeles.js";
import {configurations} from "../utils/tools.js";
import {Response} from "express"
import {UpdateProfileDto} from "../models/types.js";


export class UserController {

    async register(email: string, password: string) {
        return configurations.service_acc.register(email, password);
    }


    async login(email: string, password: string) {
        return configurations.service_acc.login(email, password);
    }


    async getProfile(userId: number) {
        return configurations.service_acc.getProfile(userId);
    }


    async updateProfile(userId: number, data: Partial<UpdateProfileDto>) {
        return configurations.service_acc.updateProfile(userId, data);
    }


    async changePassword(userId: number, oldPass: string, newPass: string) {
        return configurations.service_acc.changePassword(userId, oldPass, newPass);
    }


    async createWallet(userId: number) {
        return configurations.service_acc.createWallet(userId);
    }


    async getWallets(userId: number) {
        return configurations.service_acc.getWallets(userId);
    }


    async getTransactions(userId: number) {
        return configurations.service_acc.getTransactions(userId);
    }


    async deleteAccount(userId: number) {
        return configurations.service_acc.deleteAccount(userId);
    }
}
