import express from "express";
import {adminRouter} from "./adminrouter.js";
import {userRouter} from "./userrouter.js";
import {paymentRouter} from "./paymentRoutes.js";
import {HelathRouts} from "./helathRouts.js";

export const wallrauts= express.Router();
wallrauts.use('/admin', adminRouter)
wallrauts.use('/user', userRouter)
wallrauts.use('/payments', paymentRouter)
wallrauts.use('/health', HelathRouts)

