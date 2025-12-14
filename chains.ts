// Assumed location: /app/chains.ts

import { ChainConfig } from './types.js'; // FIX: Use 'import' and .js extension

// FIX: Use a separate 'export' for ChainConfig to satisfy FlashbotsMEVExecutor.ts import
export { ChainConfig } from './types.js'; 

function getEnv(key: string): string {
    // FIX: Read from process.env, which is loaded by config.ts/dotenv
    const value = process.env[key]; 
    if (!value) {
        console.warn(`Environment variable ${key} is not set. Using placeholder.`);
        return `http://placeholder-for-${key}.local`; 
    }
    return value;
}

export const CHAINS: ChainConfig[] = [ // This line now works
    {
        chainId: 1, 
        name: 'Ethereum Mainnet',
        // FIX: Ensure environment variable names match those in .env/index.ts
        httpUrl: getEnv('ETH_HTTP_RPC_URL'), 
        wssUrl: getEnv('ETH_WSS_URL'),
        flashbotsUrl: getEnv('FLASHBOTS_URL'),
    },
];
