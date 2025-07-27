import express from "express";
import {UserController} from "../controllers/UserController.js";
import {
        AuthReq,
        changePasswordSchema,
        loginSchema,
        RegisterDto,
        registerSchema,
        Role,
        updateProfileSchema
} from "../models/modeles.js";
import asyncHandler from 'express-async-handler';

export const userRouter=express.Router()
 const controller= new UserController();
userRouter.post(
    '/register',
    asyncHandler(async (req: AuthReq, res): Promise<void> => {
        const { error } = registerSchema.validate(req.body);
        if (error) res.status(400).json({ error: error.details[0].message });
        const data:RegisterDto=req.body;
        if(!data) res.status(400).json({ error:`no password or login` });
        const result = await controller.register(data.email, data.password);
          res.json(result);
    })
);

userRouter.post(
    '/login',
    asyncHandler(async (req: AuthReq, res):Promise<void> => {
        const { error } = loginSchema.validate(req.body);
        if (error)  res.status(400).json({ error: error.details[0].message });
        const email=req.body.email;
        const password=req.body.password;
        if(!email||!password) res.status(400).json({ error:`no password or login` });
        const result = await controller.login(email, password);
        res.json(result);
    })
);

userRouter.get(
    '/profile',
    asyncHandler(async (req: AuthReq, res):Promise<void> => {
        const data=req.user!.userId as number;
        if (!data) res.status(401).json({ error: 'Unauthorized' });
        const profile = await controller.getProfile(data);
        res.json(profile);
    })
);

userRouter.put(
    '/profile',
    asyncHandler(async (req: AuthReq, res):Promise<void> => {
        const data=req.user!.userId as number;
        if (!data) res.status(401).json({ error: 'Unauthorized' });
        const { error } = updateProfileSchema.validate(req.body);
        if (error)  res.status(400).json({ error: error.details[0].message });
        if(!req.body) res.status(400).json({ error: 'no body' });
        const updated = await controller.updateProfile(data, req.body);
        res.json(updated);
    })
);

userRouter.put(
    '/profile/password',
    asyncHandler(async (req: AuthReq, res) => {
        const data=req.user!.userId as number;
        if (!data) res.status(401).json({ error: 'Unauthorized' });
        const { error } = changePasswordSchema.validate(req.body);
        if (error)  res.status(400).json({ error: error.details[0].message });
        const { oldPass, newPass } = req.body;
        if(!oldPass!||!newPass) res.status(401).json({ error: 'no old pass or new pass' });
        await controller.changePassword(data, oldPass, newPass);
        res.status(204).end();
    })
);

userRouter.post(
    '/wallets',
    asyncHandler(async (req: AuthReq, res) => {
        const data=req.user!.userId as number;
        if (!data) res.status(401).json({ error: 'Unauthorized' });
        const wallet = await controller.createWallet(data);
        res.json(wallet);
    })
);

userRouter.get(
    '/wallets',
    asyncHandler(async (req: AuthReq, res) => {
        const data=req.user!.userId as number;
        if (!data) res.status(401).json({ error: 'Unauthorized' });
        const wallets = await controller.getWallets(data);
        res.json(wallets);
    })
);
userRouter.get(
    '/transactions',
    asyncHandler(async (req: AuthReq, res):Promise<void> => {
        const data=req.user!.userId as number;
        if (!data) throw new Error("problem")
        const transactions = await controller.getTransactions(data);
        res.json(transactions);
    })
);