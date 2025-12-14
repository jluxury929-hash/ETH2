import { ProductionMEVBot } from './ProductionMEVBot.js'; // FIX: Added .js
import { APIServer } from './APIServer.js'; // FIX: Import APIServer
import { WorkerPool } from './WorkerPool.js'; // FIX: Import WorkerPool

// Helper function to safely get environment variables
function getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
}

async function main() {
    
    // FIX: Use the corrected ENV variable names from the .env file
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
    // The worker thread file path should be relative to the running file (dist/index.js)
    const workerPool = new WorkerPool('./ExecutionWorker.js'); 
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
