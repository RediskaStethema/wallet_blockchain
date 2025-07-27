declare module 'tronweb' {
    interface Account {
        address: {
            base58: string;
            hex: string;
        };
        privateKey: string;
    }

    interface TronWebOptions {
        fullHost?: string;
        privateKey?: string;
    }

    interface EventFilter {
        eventName?: string;
        blockNumber?: number;
        size?: number;
        page?: number;
        fromBlock?: number | 'latest';
        toBlock?: number | 'latest';
        filter?: {
            [key: string]: any;
        };
        sort?: 'block_timestamp' | 'block_number';
        onlyConfirmed?: boolean;
    }

    interface EventResult {
        block_number: number;
        transaction_id: string;
        result: {
            from: string;
            to: string;
            value: string;
        };
        event_name: string;
        contract_address: string;
    }

    class TronWeb {
        constructor(options: TronWebOptions);

        createAccount(): Promise<Account>;

        getEventResult(
            contractAddress: string,
            options: EventFilter
        ): Promise<EventResult[]>;

        trx: {
            getBalance(address: string): Promise<number>;
            getTransactionInfo(txID: string): Promise<any>;
        };
    }

    export default TronWeb;
}
