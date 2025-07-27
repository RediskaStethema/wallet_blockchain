import express from "express";
import {AdminController} from "../controllers/AdminController.js";
import asyncHandler from "express-async-handler";
import {AuthReq, Role} from "../models/modeles.js";

export const adminRouter=express.Router()
const adminController= new AdminController()

adminRouter.get(
    '/users',
    asyncHandler(async (req: AuthReq, res) => {
        const users = await adminController.getAllUsers();
        res.json(users);
    })
);
adminRouter.post(
    '/register',
    asyncHandler(async (req, res) => {
        const {email, password}= req.body;
        if(!email || !password){
            throw new Error("invalid email or password");
        }
        const result = await adminController.registerAdmin(email,password);
        res.json(result);
    })
);


adminRouter.get(
    '/users/:id',
    asyncHandler(async (req: AuthReq, res) => {
        const userId = Number(req.params.id);
        if (isNaN(userId))  {res.status(400).json({ error: 'Invalid user id' });
            return}
        const user = await adminController.getUserById(userId);
        res.json(user);
    })
);


adminRouter.put(
    '/users/:id/role',
    asyncHandler(async (req: AuthReq, res) => {
        const userId = Number(req.params.id);
        const { role } = req.body;
        if (isNaN(userId)) res.status(400).json({ error: 'Invalid user id' });
        if (!role || (role !== Role.USER && role !== Role.ADMIN)){res.status(400).json({ error: 'Invalid user id' });
            return}
        await adminController.updateUserRole(userId, role);
        res.json({ message: 'User role updated' });
    })
);


adminRouter.delete(
    '/users/:id',
    asyncHandler(async (req: AuthReq, res) => {
        const userId = Number(req.params.id);
        if (isNaN(userId)) {res.status(400).json({ error: 'Invalid user id' });
        return}
        await adminController.deleteUser(userId);
        res.json({ message: 'User deleted' });
    })
);


adminRouter.get(
    '/wallets',
    asyncHandler(async (req: AuthReq, res) => {
        const wallets = await adminController.getAllWallets();
        res.json(wallets);
    })
);


adminRouter.get(
    '/users/:id/wallets',
    asyncHandler(async (req: AuthReq, res) => {
        const userId = Number(req.params.id);
        if (isNaN(userId)) {res.status(400).json({ error: 'Invalid user id' });
            return}

        const wallets = await adminController.getWalletsByUser(userId);
        res.json(wallets);
    })
);


adminRouter.get(
    '/wallets/:address/balance',
    asyncHandler(async (req: AuthReq, res) => {
        const address = req.params.address;
        if (!address) {res.status(400).json({ error: 'Invalid user id' });
            return}

        const balance = await adminController.getWalletBalance(address);
        res.json({ address, balance });
    })
);


adminRouter.get(
    '/transactions',
    asyncHandler(async (req: AuthReq, res) => {
        const transactions = await adminController.getAllTransactions();
        res.json(transactions);
    })
);


adminRouter.get(
    '/users/:id/transactions',
    asyncHandler(async (req: AuthReq, res) => {
        const userId = Number(req.params.id);
        if (isNaN(userId)) {res.status(400).json({ error: 'Invalid user id' });
            return}

        const transactions = await adminController.getTransactionsByUser(userId);
        res.json(transactions);
    })
);


adminRouter.put(
    '/transactions/:txId/status',
    asyncHandler(async (req: AuthReq, res) => {
        const txId = req.params.txId;
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'failed'];
        if (!txId) {
          res.status(400).json({error: 'Transaction ID is required'})
            return ;
        }
        if (!status || !validStatuses.includes(status))
        {res.status(400).json({ error: 'Invalid status' });
            return}

        await adminController.updateTransactionStatus(txId, status);
        res.json({ message: 'Transaction status updated' });
    })
);