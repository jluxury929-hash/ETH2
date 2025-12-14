import { ProductionMEVBot } from './ProductionMEVBot.js';
import { APIServer } from './APIServer.js';
import { WorkerPool } from './WorkerPool.js';

// FIX: Import path and url modules for robust worker thread path resolution
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module file (dist/index.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to safely get environment variables
function getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
}

async function main() {
    
    // Environment variables
    const walletPrivateKey = getEnv('EVM_WALLET_PRIVATE_KEY');
    const authPrivateKey = getEnv('EVM_AUTH_PRIVATE_KEY');
    const rpcUrl = getEnv('ETH_HTTP_RPC_URL');
    const wssUrl = getEnv('ETH_WSS_URL');
    const flashbotsUrl = getEnv('FLASHBOTS_URL');
    const apiPort = parseInt(getEnv('PORT') || '8080', 10); 
    
    // 1. Initialize Bot Core
    const bot = await ProductionMEVBot.create(
        walletPrivateKey,
        authPrivateKey,
        rpcUrl,
        wssUrl,
        flashbotsUrl
    );

    // 2. Initialize Worker Pool and API Server
    // FIX: Construct the absolute path to the worker script
    const workerPath = join(__dirname, 'ExecutionWorker.js'); 
    const workerPool = new WorkerPool(workerPath);
    
    const apiServer = new APIServer(workerPool, apiPort);
    
    // 3. Start services
    bot.start(); 
    apiServer.start();

    // 4. Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down gracefully...');
        bot.stop();
        workerPool.terminate();
        process.exit(0);
    });
}

main().catch(error => {
    console.error("Critical error in main application:", error);
    process.exit(1);
});
