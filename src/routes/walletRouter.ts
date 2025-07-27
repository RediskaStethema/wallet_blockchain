import express from "express";
import {adminRouter} from "./adminRouter.js";
import {userRouter} from "./userRouter.js";
import {paymentRouter} from "./paymentRouter.js";
import {HealthRouter} from "./healthRouter.js";

export const wallrauts= express.Router();
wallrauts.use('/admin', adminRouter)
wallrauts.use('/user', userRouter)
wallrauts.use('/payments', paymentRouter)
wallrauts.use('/health', HealthRouter)

