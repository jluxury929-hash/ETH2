import { parentPort } from 'worker_threads';
// FIX: Added .js extension
import { FlashbotsMEVExecutor } from './FlashbotsMEVExecutor.js'; 
import { 
    WorkerTaskData, 
    WorkerResult 
} from './types.js'; 

if (parentPort) {
    parentPort.on('message', async (wrapper: { id: number, data: WorkerTaskData }) => {
        const { id, data } = wrapper;
        
        try {
            // FIX: TS2339 - Properties are correctly extracted from typed 'data'
            const { 
                txHash, 
                pendingTx, 
                fees, 
                mevHelperContractAddress, 
                txs, 
                blockNumber,
                maxPriorityFeePerGas,
                maxFeePerGas
            } = data;
            
            // NOTE: In a real app, the executor should be initialized once per worker.
            // Placeholder logic: Simulate successful execution
            
            const result: WorkerResult = { 
                success: true, 
                message: `Successfully processed bundle for block ${blockNumber}.`,
                blockNumber: blockNumber
            };
            
            parentPort!.postMessage({ id, result });
            
        } catch (error) {
            // Simulating failure
            const result: WorkerResult = { 
                success: false, 
                message: `Execution failed: ${(error as Error).message}`, // FIX: Casting error to Error for message access
                blockNumber: data.blockNumber
            };
            // FIX: Post the error result, not null
            parentPort!.postMessage({ id, result }); 
        }
    });
}
