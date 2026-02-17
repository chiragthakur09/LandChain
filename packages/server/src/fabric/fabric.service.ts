import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Gateway, Wallets } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';
import { FabricMockService } from './fabric.mock.service';

@Injectable()
export class FabricService implements OnModuleInit, OnModuleDestroy {
    private gateway: Gateway;
    private isConnected = false;
    private mockService: FabricMockService;

    constructor() {
        this.mockService = new FabricMockService();
    }

    async onModuleInit() {
        // Decide mode based on ENV or default to trying real connection
        const useMock = process.env.USE_MOCK_FABRIC === 'true';

        if (useMock) {
            console.log('[FabricService] USE_MOCK_FABRIC=true. Skipping Network Connection.');
            await this.mockService.onModuleInit();
            return;
        }

        await this.connect();
    }

    async onModuleDestroy() {
        if (this.gateway) {
            this.gateway.disconnect();
        }
    }

    async connect() {
        try {
            const ccpPath = path.resolve(__dirname, '..', '..', '..', 'network', 'connection.json');
            const walletPath = path.join(process.cwd(), 'wallet'); // Root wallet

            if (!fs.existsSync(ccpPath)) {
                throw new Error(`Connection profile not found at ${ccpPath}`);
            }

            if (!fs.existsSync(walletPath)) {
                console.warn(`[FabricService] Wallet not found at ${walletPath}. Creating temporary memory wallet...`);
                // In prod, this would fail. For dev, we might fallback.
            }

            const wallet = await Wallets.newFileSystemWallet(walletPath);

            // Check if user exists
            const identity = await wallet.get('appUser');
            if (!identity) {
                console.warn('[FabricService] Identity "appUser" not found in wallet. Cannot connect.');
                // Fallback to Mock if Auth fails
                return;
            }

            this.gateway = new Gateway();
            await this.gateway.connect(JSON.parse(fs.readFileSync(ccpPath, 'utf8')), {
                wallet,
                identity: 'appUser',
                discovery: { enabled: true, asLocalhost: true }
            });

            this.isConnected = true;
            console.log('[FabricService] Successfully connected to Hyperledger Fabric Network (mychannel)');

        } catch (error) {
            console.error('[FabricService] Failed to connect to Fabric network:', error.message);
            console.warn('[FabricService] Falling back to Mock Mode.');
        }
    }

    async query(functionName: string, ...args: string[]): Promise<any> {
        if (!this.isConnected) {
            return this.mockService.query(functionName, ...args);
        }

        try {
            const network = await this.gateway.getNetwork('mychannel');
            const contract = network.getContract('landchain');
            const result = await contract.evaluateTransaction(functionName, ...args);
            return JSON.parse(result.toString());
        } catch (err) {
            console.error(`[FabricService] Query error for ${functionName}:`, err);
            throw err;
        }
    }

    async submit(functionName: string, ...args: string[]): Promise<any> {
        if (!this.isConnected) {
            return this.mockService.submit(functionName, ...args);
        }

        try {
            const network = await this.gateway.getNetwork('mychannel');
            const contract = network.getContract('landchain');
            await contract.submitTransaction(functionName, ...args);
            return { success: true, endorsedBy: 'RealFabricPeer' };
        } catch (err) {
            console.error(`[FabricService] Submit error for ${functionName}:`, err);
            throw err;
        }
    }
}
