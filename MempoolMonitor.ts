import { providers } from 'ethers'; 
import { logger } from './logger.js'; 
// NOTE: You must be using ethers v5 or v6 for these internal properties to work.

const RECONNECT_INTERVAL_MS = 5000; // 5 seconds
const PING_INTERVAL_MS = 30000; // Send a ping every 30 seconds

export class MempoolMonitor {
    private provider: providers.WebSocketProvider;
    public isMonitoring: boolean = false;
    private wssUrl: string;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private pingInterval: NodeJS.Timeout | null = null; // New timer for keep-alive

    constructor(wssUrl: string) {
        this.wssUrl = wssUrl;
        this.provider = this.createProvider(wssUrl);
    }
    
    // ... (rest of createProvider remains the same)
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
        });

        this.provider.on('error', (error) => {
            logger.error(`[MONITOR] Provider error (WSS): ${error.message || error}. Retrying in ${RECONNECT_INTERVAL_MS}ms...`);
            this.handleDisconnection();
        });

        this.provider.on('open', () => {
            logger.info("[MONITOR] WebSocket connection open. Starting keep-alive ping.");
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            this.startPingPong(); // Start pings on successful open
        });
        
        this.provider.on('close', (code: number, reason: string) => {
            logger.warn(`[MONITOR] WebSocket connection closed. Code: ${code}, Reason: ${reason}. Retrying in ${RECONNECT_INTERVAL_MS}ms...`);
            this.stopPingPong(); // Stop pings on close
            this.handleDisconnection();
        });
    }
    
    // NEW: Ping/Pong Implementation
    private startPingPong(): void {
        this.stopPingPong(); // Clear any existing interval
        
        // Ethers.js WebSocketProvider uses a raw WebSocket on the internal _websocket property
        const ws = (this.provider as any)._websocket; 

        if (ws && typeof ws.ping === 'function') {
            this.pingInterval = setInterval(() => {
                if (ws.readyState === ws.OPEN) {
                    // Send a ping frame to keep the connection alive
                    ws.ping(); 
                    logger.debug("[MONITOR] Sent WSS keep-alive ping.");
                }
            }, PING_INTERVAL_MS);
        }
    }

    private stopPingPong(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    
    private handleDisconnection(): void {
        if (!this.isMonitoring || this.reconnectTimeout) return;
        
        // Clean up current provider instance
        this.stopPingPong(); // Make sure to stop pinging
        this.provider.removeAllListeners();
        // ... (rest of destruction remains the same)
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
        this.stopPingPong(); // Stop pings on graceful shutdown
        this.provider.removeAllListeners();
        // ... (rest of destruction remains the same)
        if (typeof (this.provider as any).destroy === 'function') {
            (this.provider as any).destroy(); 
        } else if (typeof (this.provider as any).close === 'function') {
            (this.provider as any).close(); 
        }
        logger.info("[MONITOR] Monitoring stopped.");
    }
}
