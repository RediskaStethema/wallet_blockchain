import WebSocket, {Server as WebSocketServer} from 'ws';
import {PollingService} from '../../src/services/PollingService.js';
import {PaymentService} from '../../src/services/PaymentService.js';
import {PaymentData, PaymentStatus} from "../../src/models/modeles.js";

jest.useFakeTimers();

describe('PollingService', () => {
    let paymentServiceMock: jest.Mocked<PaymentService>;
    let wssMock: jest.Mocked<WebSocketServer>;
    let pollingService: PollingService;
    let clientMock: any;

    beforeEach(() => {
        paymentServiceMock = {
            pollIncomingTransactions: jest.fn(),
        } as any;

        clientMock = {
            readyState: WebSocket.OPEN,
            send: jest.fn(),
        };

        wssMock = {
            clients: new Set([clientMock]),
        } as any;

        pollingService = new PollingService(paymentServiceMock, wssMock);
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.clearAllMocks();
        pollingService.stopPolling();
    });

    test('startPolling sets interval and polls paymentService', async () => {
        paymentServiceMock.pollIncomingTransactions.mockResolvedValue([]);

        pollingService.startPolling(1000);

        // Запускаем таймеры (один тик)
        jest.advanceTimersByTime(1000);

        expect(paymentServiceMock.pollIncomingTransactions).toHaveBeenCalledTimes(1);

        // Запускаем второй тик
        jest.advanceTimersByTime(1000);
        expect(paymentServiceMock.pollIncomingTransactions).toHaveBeenCalledTimes(2);
    });

    test('startPolling does not create multiple intervals', () => {
        paymentServiceMock.pollIncomingTransactions.mockResolvedValue([]);

        pollingService.startPolling(1000);
        pollingService.startPolling(1000);

        jest.advanceTimersByTime(1000);
        expect(paymentServiceMock.pollIncomingTransactions).toHaveBeenCalledTimes(1);
    });

    test('startPolling sends payment_received messages to open clients', async () => {

        const payment: PaymentData = {
            id: 1,
            walletId: 10,
            txId: 'tx123',
            amount: 100,
            status: PaymentStatus.Pending,
            createdAt: new Date(),
        };
        paymentServiceMock.pollIncomingTransactions.mockResolvedValue([payment]);

        pollingService.startPolling(1000);

        jest.advanceTimersByTime(1000);

        expect(clientMock.send).toHaveBeenCalledWith(JSON.stringify({
            type: 'payment_received',
            data: payment,
        }));
    });

    test('startPolling does not send messages to clients not open', () => {
        const payment: PaymentData = {
            id: 1,
            walletId: 10,
            txId: 'tx123',
            amount: 100,
            status: PaymentStatus.Pending,
            createdAt: new Date(),
        };
        paymentServiceMock.pollIncomingTransactions.mockResolvedValue([payment]);


        clientMock.readyState = WebSocket.CLOSING;

        pollingService.startPolling(1000);

        jest.advanceTimersByTime(1000);

        expect(clientMock.send).not.toHaveBeenCalled();
    });

    test('startPolling catches and logs errors', () => {
        const error = new Error('fail');
        paymentServiceMock.pollIncomingTransactions.mockRejectedValue(error);
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        pollingService.startPolling(1000);
        jest.advanceTimersByTime(1000);

        expect(consoleErrorSpy).toHaveBeenCalledWith(error);

        consoleErrorSpy.mockRestore();
    });

    test('stopPolling clears interval', () => {
        paymentServiceMock.pollIncomingTransactions.mockResolvedValue([]);
        pollingService.startPolling(1000);

        expect(setInterval).toHaveBeenCalledTimes(1);

        pollingService.stopPolling();

        // После остановки таймер не должен вызываться
        jest.advanceTimersByTime(1000);

        expect(paymentServiceMock.pollIncomingTransactions).toHaveBeenCalledTimes(0);
    });
});
