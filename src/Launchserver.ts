import * as fs from "node:fs";
import express from 'express';
import morgan from "morgan";
import http from 'http';
import { PollingService } from "./services/PollingService.js";
import {configurations, skiprouts} from "./utils/tools.js";
import { wallrauts } from "./routes/walletRouter.js";
import { errorHandler } from "./errorHandler/errorHandler.js";
import WebSocket, { WebSocketServer } from "ws";
import {Authent} from "./middleware/authent.js";
import {authorize} from "./middleware/authoriz.js";


export const launchserver = () => {
    const logstream = fs.createWriteStream("launchserver.log");
    const PORT = 3005;
    const app = express();

    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });

    const pollingService = new PollingService(configurations.service_payment, wss);

    wss.on('connection', (ws: WebSocket) => {
        ws.on('message', (data: WebSocket.RawData) => {
            const message = data.toString();
            if (message === 'start_polling') {
                pollingService.startPolling();
            } else if (message === 'stop_polling') {
                pollingService.stopPolling();
            }
        });
    });

    app.use(express.json());
    app.use(morgan('dev'));
    app.use(morgan('combined', { stream: logstream }));


    app.use(skiprouts(configurations.paths_skips));
    app.use(Authent({ jwtSecret: configurations.jwt.secret }));
    app.use(authorize(configurations.pathroles as Record<string, string[]>));


    app.use('/api', wallrauts);



    app.use(errorHandler);

    server.listen(PORT, () => {
        console.log(`http://localhost:${PORT}`);
    });
};