import express from "express";
import {adminRouter} from "./adminrouter";
import {userRouter} from "./userrouter";

export const wallrauts= express.Router();
wallrauts.use('/admin', adminRouter)
wallrauts.use('/user', userRouter)
wallrauts.use('/payments', userRouter)
