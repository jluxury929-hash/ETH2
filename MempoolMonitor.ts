import { providers } from 'ethers'; 
import { logger } from './logger.js'; 

const RECONNECT_INTERVAL_MS = 5000; // 5 seconds

export class MempoolMonitor {
    private provider: providers.WebSocketProvider;
    public isMonitoring: boolean = false;
    private wssUrl: string;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    constructor(wssUrl: string) {
        this.wssUrl = wssUrl;
        this.provider = this.createProvider(wssUrl);
    }
    
    private createProvider(wssUrl: string): providers.WebSocketProvider {
        const provider = new providers.WebSocketProvider(wssUrl);
        provider.removeAllListeners(); 
        return provider;
    }

    public start(): void {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.setupListeners();
        logger.info(`[MONITOR] Attempting connection to WSS: ${this.wssUrl}`);
    }

    private setupListeners(): void {
        this.provider.on('pending', (txHash: string) => {
            logger.debug(`[MONITOR] Received pending transaction hash: ${txHash.substring(0, 10)}...`);
            // NOTE: In a real app, this event should trigger the WorkerPool.addTask logic
        });

        this.provider.on('error', (error) => {
            logger.error(`[MONITOR] Provider error (WSS): ${error.message}. Retrying in ${RECONNECT_INTERVAL_MS}ms...`);
            this.handleDisconnection();
        });

        this.provider.on('open', () => {
            logger.info("[MONITOR] WebSocket connection open.");
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        });
        
        this.provider.on('close', (code: number, reason: string) => {
            logger.warn(`[MONITOR] WebSocket connection closed. Code: ${code}, Reason: ${reason}. Retrying in ${RECONNECT_INTERVAL_MS}ms...`);
            this.handleDisconnection();
        });
    }
    
    private handleDisconnection(): void {
        if (!this.isMonitoring || this.reconnectTimeout) return;
        
        // Clean up current provider instance
        this.provider.removeAllListeners();
        if (typeof (this.provider as any).destroy === 'function') {
            (this.provider as any).destroy(); 
        }

        // Attempt reconnection
        this.reconnectTimeout = setTimeout(() => {
            logger.info("[MONITOR] Attempting WSS reconnection...");
            this.provider = this.createProvider(this.wssUrl);
            this.setupListeners();
            this.reconnectTimeout = null;
        }, RECONNECT_INTERVAL_MS);
    }

    public stop(): void {
        this.isMonitoring = false;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.provider.removeAllListeners();
        if (typeof (this.provider as any).destroy === 'function') {
            (this.provider as any).destroy(); 
        } else if (typeof (this.provider as any).close === 'function') {
            (this.provider as any).close(); 
        }
        logger.info("[MONITOR] Monitoring stopped.");
    }
}
