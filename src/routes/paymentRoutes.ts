import express from "express";
import { PaymentController } from "../controllers/PaymentController.js";
import asyncHandler from "express-async-handler";
import { AuthReq, PaymentStatus } from "../models/modeles.js";

export const paymentRouter = express.Router();
const controller = new PaymentController();

paymentRouter.post(
    "/orders",
    asyncHandler(async (req: AuthReq, res) => {
        const { amount } = req.body;
        if (!amount || typeof amount !== "number") {
            res.status(400).json({ error: "Amount is required and must be number" });
            return}

        const order = await controller.createOrder(req.user!.userId, amount);
        res.json(order);
    })
);

paymentRouter.get(
    "/orders",
    asyncHandler(async (req, res) => {
        const { status } = req.query;
        const result = await controller.getAllOrders(status as PaymentStatus);
        res.json(result);
    })
);

paymentRouter.get(
    "/orders/:id",
    asyncHandler(async (req, res) => {
        const orderId = Number(req.params.id);
        if (isNaN(orderId)) {
             res.status(400).json({ error: "Invalid order ID" });
            return  }

        const order = await controller.getOrderById(orderId);
        res.json(order);
    })
);

paymentRouter.post(
    "/orders/:id/wallet",
    asyncHandler(async (req, res) => {
        const orderId = Number(req.params.id);
        if (isNaN(orderId)) {
             res.status(400).json({ error: "Invalid order ID" });
            return }

        const wallet = await controller.createWalletForOrder(orderId);
        res.json(wallet);
    })
);

paymentRouter.get(
    "/orders/:id/wallet",
    asyncHandler(async (req, res) => {
        const orderId = Number(req.params.id);
        if (isNaN(orderId)) {
            res.status(400).json({ error: "Invalid order ID" });
            return}

        const wallet = await controller.getWalletByOrder(orderId);
        res.json(wallet);
    })
);

paymentRouter.get(
    "/wallets/:address/check",
    asyncHandler(async (req, res) => {
        const { address } = req.params;
        const result = await controller.checkIncomingPayments(address);
        res.json(result);
    })
);

paymentRouter.get(
    "/wallets/:address/balance",
    asyncHandler(async (req, res) => {
        const { address } = req.params;
        const balance = await controller.getWalletBalance(address);
        res.json({ address, balance });
    })
);

paymentRouter.put(
    "/transactions/:txId/confirm",
    asyncHandler(async (req, res) => {
        const { txId } = req.params;
        await controller.confirmTransaction(txId);
        res.json({ message: "Transaction confirmed" });
    })
);

paymentRouter.put(
    "/orders/:id/cancel",
    asyncHandler(async (req, res) => {
        const orderId = Number(req.params.id);
        if (isNaN(orderId)) {
             res.status(400).json({ error: "Invalid order ID" });
            return
        }

        await controller.cancelOrder(orderId);
        res.json({ message: "Order cancelled" });
    })
);

paymentRouter.post(
    "/orders/:id/notify",
    asyncHandler(async (req, res) => {
        const orderId = Number(req.params.id);
        if (isNaN(orderId)) {
            res.status(400).json({ error: "Invalid order ID" });

            return }

        await controller.notify(orderId);
        res.json({ message: "Webhook sent" });
    })
);

paymentRouter.get(
    "/poll",
    asyncHandler(async (_req, res) => {
        const newPayments = await controller.pollIncomingTransactions();
        res.json(newPayments);
    })
);
paymentRouter.put(
    "/orders/:id/status",
    asyncHandler(async (req, res) => {
        const orderId = Number(req.params.id);
        const { status } = req.body;

        if (isNaN(orderId)) {
            res.status(400).json({ error: "Invalid order ID" });
            return   }

        if (!status || !Object.values(PaymentStatus).includes(status)) {
           res.status(400).json({ error: "Invalid or missing status" });
            return  }

        const updatedOrder = await controller.updateOrderStatus(orderId, status);
        res.json(updatedOrder);
    })
);
