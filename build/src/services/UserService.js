"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
class UserService {
    changePassword(userId, oldPass, newPass) {
        return Promise.resolve(undefined);
    }
    createWallet(userId) {
        return Promise.resolve(undefined);
    }
    deleteAccount(userId) {
        return Promise.resolve(undefined);
    }
    getProfile(userId) {
        return Promise.resolve(undefined);
    }
    getTransactions(userId) {
        return Promise.resolve([]);
    }
    getWallets(userId) {
        return Promise.resolve([]);
    }
    login(email, password) {
        return Promise.resolve({ token: "" });
    }
    register(email, password) {
        return Promise.resolve({ token: "" });
    }
    updateProfile(userId, data) {
        return Promise.resolve(undefined);
    }
}
exports.UserService = UserService;
