import { ethers, providers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber'; // Import is correct

import { logger } from './logger.js';
import { Strategy } from './types.js'; // FIX: Added .js extension
import { FlashbotsMEVExecutor } from './FlashbotsMEVExecutor.js'; // FIX: Added .js extension
import { MempoolMonitor } from './MempoolMonitor.js'; // FIX: Added .js extension
import { APIServer } from './APIServer.js'; // FIX: Added import for APIServer

export class ProductionMEVBot {
    private monitor: MempoolMonitor;
    private executor: FlashbotsMEVExecutor;
    private walletAddress: string;
    private apiServer?: APIServer; // FIX: Added optional APIServer

    constructor(
        executor: FlashbotsMEVExecutor,
        monitor: MempoolMonitor,
        walletAddress: string
    ) {
        this.executor = executor;
        this.monitor = monitor;
        this.walletAddress = walletAddress;
    }
    
    // FIX: Removed APIServer setup from static create, should be done in index.ts or start()
    static async create(
        walletPrivateKey: string,
        authPrivateKey: string,
        rpcUrl: string,
        wssUrl: string,
        flashbotsUrl: string
    ): Promise<ProductionMEVBot> {
        // 1. Initialize Executor
        const executor = await FlashbotsMEVExecutor.create(
            walletPrivateKey,
            authPrivateKey,
            rpcUrl,
            flashbotsUrl
        );
        const walletAddress = executor.getWalletAddress();

        // 2. Initialize Monitor
        const monitor = new MempoolMonitor(wssUrl);

        logger.info(`Bot initialized for wallet: ${walletAddress}`);
        return new ProductionMEVBot(executor, monitor, walletAddress);
    }

    public start(): void {
        logger.info("Starting MEV Bot...");
        
        // This starts the WebSocket connection
        this.monitor.start(); 

        // Start main strategy loop (currently placeholder)
        this.runStrategyLoop();
    }

    private async runStrategyLoop(): Promise<void> {
        if (this.monitor.isMonitoring) { 
            logger.debug("Mempool monitor is active. Ready to process transactions.");
        }
        // NOTE: The main MEV logic loop will run here, analyzing transactions received by the monitor.
    }

    public stop(): void {
        this.monitor.stop();
        logger.warn("MEV Bot gracefully stopped.");
    }
}
