import { Injectable, OnModuleInit } from '@nestjs/common';
import { Gateway, Wallets } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
@Injectable()
export class FabricMockService implements OnModuleInit {
    private gateway: Gateway;
    private isConnected = false;

    async onModuleInit() {
        // In a real app, we would connect here.
        // For POC without running network, we skip connection to allow app to start.
        console.log('FabricService initialized. Pending connection to network...');
    }

    async connect() {
        if (this.isConnected) return;

        try {
            // TODO: Load connection profile and wallet
            // const ccpPath = path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
            // const walletPath = path.join(process.cwd(), 'wallet');
            // const wallet = await Wallets.newFileSystemWallet(walletPath);

            // this.gateway = new Gateway();
            // await this.gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

            this.isConnected = true;
            console.log('Connected to Hyperledger Fabric Network');
        } catch (error) {
            console.error('Failed to connect to Fabric network', error);
        }
    }

    async query(functionName: string, ...args: string[]): Promise<any> {
        // Mock Response for Vibe Coding (since network isn't running)
        if (!this.isConnected) {
            console.warn('Network not connected. Returning mock data.');
            return this.getMockData(functionName, args);
        }

        const network = await this.gateway.getNetwork('mychannel');
        const contract = network.getContract('landchain');
        const result = await contract.evaluateTransaction(functionName, ...args);
        return JSON.parse(result.toString());
    }

    async submit(functionName: string, ...args: string[]): Promise<any> {
        // Simulate Endorsement Policy Routing
        const targetOrg = this.getTargetOrg(functionName);
        console.log(`[FabricService] Routing '${functionName}' to ${targetOrg} Peer for Endorsement...`);

        if (!this.isConnected) {
            console.warn('Network not connected. Simulating submission.');
            return { success: true, txId: 'MOCK_TX_' + Date.now(), endorsedBy: targetOrg };
        }

        const network = await this.gateway.getNetwork('mychannel');
        const contract = network.getContract('landchain');

        // In real Fabric, we would use discovery or specific peers here
        await contract.submitTransaction(functionName, ...args);
        return { success: true, endorsedBy: targetOrg };
    }

    private getTargetOrg(functionName: string): string {
        switch (functionName) {
            case 'createParcel':
            case 'finalizeTitle':
                return 'RevenueOrg (Govt)';
            case 'resolveDispute':
                return 'CourtOrg (Judiciary)';
            case 'recordIntimation': // If Charge
                return 'BankOrg (Financial)';
            default:
                return 'Any Peer (Revenue/Bank/Court)';
        }
    }

    private getMockData(functionName: string, args: string[]) {
        if (functionName === 'getPaymentDetails') {
            const utr = args[0];
            if (utr === 'UTR_VALID_MOCK') {
                return {
                    utr: utr,
                    parcelId: 'PARCEL_MOCK_123',
                    amount: 5000000,
                    payerId: 'BUYER_MOCK',
                    payeeId: 'SELLER_MOCK',
                    timestamp: Date.now(),
                    status: 'CONFIRMED',
                    type: 'SALE_PRICE'
                };
            }
            throw new Error(`Payment ${utr} not found`);
        }

        if (functionName === 'getParcel') {
            const parcelId = args[0];

            if (parcelId === 'PARCEL_001') {
                return {
                    parcelId: parcelId,
                    surveyNo: '100',
                    subDivision: '0',
                    landUseType: 'AGRICULTURAL',
                    area: 10.0,
                    status: 'FREE',
                    geoJson: 'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))',
                    title: {
                        titleId: 'TITLE_PARCEL_001',
                        owners: [{ ownerId: 'IND_CITIZEN_123', sharePercentage: 100 }],
                        isConclusive: false
                    },
                    disputes: [],
                    charges: []
                };
            }

            if (parcelId === 'PARCEL_LOCKED') {
                return {
                    parcelId: parcelId,
                    surveyNo: '100',
                    subDivision: '5',
                    landUseType: 'RESIDENTIAL',
                    area: 0.5,
                    status: 'LOCKED',
                    geoJson: 'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))',
                    title: {
                        titleId: 'TITLE_PARCEL_LOCKED',
                        owners: [{ ownerId: 'IND_CITIZEN_456', sharePercentage: 100 }],
                        isConclusive: false
                    },
                    disputes: [],
                    charges: [{
                        chargeId: 'CHG_001',
                        type: 'TAX_DEFAULT',
                        holder: 'MUNICIPAL_CORP',
                        active: true,
                        amount: 5000
                    }]
                };
            }

            // Throw error for unknown parcels to match Chaincode behavior
            throw new Error(`The parcel ${parcelId} does not exist`);
        }

        if (functionName === 'getPublicParcelDetails') {
            const parcelId = args[0];
            // Reuse getParcel logic for mock data
            const fullParcel = this.getMockData('getParcel', [parcelId]);

            // Redact it
            return {
                parcelId: fullParcel.parcelId,
                status: fullParcel.status,
                location: 'Available',
                ownerCount: fullParcel.title.owners.length,
                owners: [{ type: 'Redacted', share: 100 }],
                disputeStatus: 'Clear',
                mortgageStatus: 'Clear'
            };
        }

        return {};
    }
}
