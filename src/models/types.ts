
export type WallError = {status:number, message:string}

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
    status: 'pending' | 'confirmed' | 'failed';
    createdAt: Date;
};

export type UpdateProfileDto = {
    email?: string;
    username?: string;
};


