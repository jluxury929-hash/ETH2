import { providers } from 'ethers'; // Removed unused 'ethers' import
import { logger } from './logger.js'; 

export class MempoolMonitor {
    private provider: providers.WebSocketProvider;
    public isMonitoring: boolean = false; // FIX: Added property for TS2339

    constructor(wssUrl: string) {
        this.provider = new providers.WebSocketProvider(wssUrl);
    }
    
    public start(): void {
        this.isMonitoring = true;
        this.provider.removeAllListeners(); 
        this.setupListeners();
        // FIX: The 'open' listener in setupListeners handles the initial connection log
    }

    private setupListeners(): void {
        this.provider.on('pending', (txHash: string) => {
            logger.debug(`[MONITOR] Received pending transaction hash: ${txHash.substring(0, 10)}...`);
        });

        this.provider.on('error', (error) => {
            logger.error(`[MONITOR] Provider error: ${error.message}`);
        });

        this.provider.on('open', () => {
            logger.info("[MONITOR] WebSocket connection open. Monitoring started.");
        });
        
        // FIX: Added close listener for robust operation
        this.provider.on('close', (code: number, reason: string) => {
            logger.warn(`[MONITOR] WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
        });
    }

    public stop(): void {
        this.provider.removeAllListeners();
        // FIX: Use the provider's close method if available
        if (typeof (this.provider as any).destroy === 'function') {
            (this.provider as any).destroy(); 
        } else if (typeof (this.provider as any).close === 'function') {
            (this.provider as any).close(); 
        }
        this.isMonitoring = false;
        logger.info("[MONITOR] Monitoring stopped.");
    }
}
