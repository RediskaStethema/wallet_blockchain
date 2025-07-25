import express from "express";
import {PaymentController} from "../controllers/PaymentController";


export const paymentRoutes=express.Router();
const paymentController= new PaymentController()