import express from "express";
import {AuthReq, pool} from "../models/modeles.js";


export const HealthRouter = express.Router()


HealthRouter.get('/select', async (req:AuthReq, res) => {
    try {
        await pool.query('SELECT 1'); // простой запрос в БД
        res.status(200).send('OK');
    } catch (err) {
        console.error('Health check failed:', err);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});


HealthRouter.get('/public', (req:AuthReq, res) => {
    res.json({
        service: 'USDT TRC-20 Payment System',
        version: '1.0.0',
        description: 'Public info endpoint, no auth required',
        timestamp: new Date().toISOString(),
    });
});