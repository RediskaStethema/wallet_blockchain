import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);


const TronWebModule = require('tronweb');


const TronWeb = TronWebModule.default?.TronWeb || TronWebModule.TronWeb || TronWebModule;


export const tronWeb = new TronWeb({
    fullHost: process.env.TRON_FULLNODE || 'https://api.trongrid.io',
});