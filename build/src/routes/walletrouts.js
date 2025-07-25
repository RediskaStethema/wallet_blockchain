"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wallrauts = void 0;
const express_1 = __importDefault(require("express"));
const adminrouter_1 = require("./adminrouter");
const userrouter_1 = require("./userrouter");
exports.wallrauts = express_1.default.Router();
exports.wallrauts.use('/admin', adminrouter_1.adminRouter);
exports.wallrauts.use('/user', userrouter_1.userRouter);
