import {NextFunction, Request, Response} from "express";
import {WallError} from "../models/types.js";


export const errorHandler = (err:Error, req:Request, res:Response, next:NextFunction) => {
    try{
        const error:WallError = JSON.parse(err.message)
        res.status(error.status).end(error.message)
    } catch (e) {
        res.status(500).end(`Unknown server error : ${err.message}`)
    }
}