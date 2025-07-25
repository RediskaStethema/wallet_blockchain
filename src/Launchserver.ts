import * as fs from "node:fs";
import express from 'express';
import morgan from "morgan";
import {errorHandler} from "./errorHandler/errorHandler";
import {wallrauts} from "./routes/walletrouts";


export const  launchserver=()=>{
    const logstream=fs.createWriteStream("launchserver.log");
    const PORT=3005
    const socket=`launchserver on port:${PORT}`;
    const app = express();
    app.listen(PORT,()=>{
        console.log(socket)

        app.use(express.json());
        app.use(morgan('dev'));
        app.use(morgan('combined', {stream: logstream}))

        app.use(`/api`, wallrauts)



        app.use(errorHandler)

    } )

}