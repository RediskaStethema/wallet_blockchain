import TronWeb from "tronweb";


export const tronWeb = new TronWeb({
    fullHost: process.env.TRON_FULLNODE || 'https://api.trongrid.io',
});