import {Role, TransactionStatus} from "./modeles.js";

export type WallError = {status:number,
    message:string}

export type WalletData = {
    id: number;
    address: string;
    createdAt: Date;
};

export type UserProfile = {
    id: number;
    email: string;
    createdAt: Date;
    wallets?: WalletData[]; // опционально, если не всегда нужен список
};

export type TransactionData = {
    id: number;
    txId: string;
    amount: number;
    status: TransactionStatus ;
    createdAt: Date;
    wallet?: string
};

export type UpdateProfileDto = {
    email?: string;
    username?: string;
};

export type AdminEmp={
    id: number,
    email: string,
    role:Role,
    token: string,

}