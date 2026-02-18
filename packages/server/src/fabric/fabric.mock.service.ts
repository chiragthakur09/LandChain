import { Injectable, OnModuleInit } from '@nestjs/common';
import { Gateway, Wallets } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FabricMockService implements OnModuleInit {
    private gateway: Gateway;
    private isConnected = false;
    // In-memory store for E2E testing
    private mockLedger: Map<string, any> = new Map();

    async onModuleInit() {
        console.log('FabricService initialized. Pending connection to network...');
        // Seed some initial data
        this.mockLedger.set('MH12PUNE010001', {
            ulpin: 'MH12PUNE010001',
            surveyNo: '100',
            subDivision: '0',
            landUseType: 'AGRICULTURAL',
            area: 10.0,
            status: 'FREE',
            geoJson: 'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))',
            title: {
                titleId: 'TITLE_MH12PUNE010001',
                owners: [{ ownerId: 'IND_CITIZEN_123', sharePercentage: 100 }],
                isConclusive: false
            },
            disputes: [],
            charges: [],
            legacyIdentifiers: { ctsNumber: '450/A', surveyNumber: '100' }
        });
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

            this.isConnected = true; // Simulate connection for logic flow if needed, but we keep using mock
            console.log('Connected to Hyperledger Fabric Network (Mocked)');
        } catch (error) {
            console.error('Failed to connect to Fabric network', error);
        }
    }

    async query(functionName: string, ...args: string[]): Promise<any> {
        if (!this.isConnected || true) { // Always use mock for now if real network is down
            // console.warn('Network not connected or Mock Forced. Returning mock data.');
            return this.getMockData(functionName, args);
        }

        const network = await this.gateway.getNetwork('mychannel');
        const contract = network.getContract('landchain');
        const result = await contract.evaluateTransaction(functionName, ...args);
        return JSON.parse(result.toString());
    }

    async submit(functionName: string, ...args: string[]): Promise<any> {
        const targetOrg = this.getTargetOrg(functionName);
        console.log(`[FabricService Mock] Executing '${functionName}'...`);

        if (functionName === 'createParcel') {
            const [ulpin, ownersJson, geoJson, docHash, legacyJson, spatialDataJson] = args;
            let owners = [];
            try {
                if (ownersJson.trim().startsWith('[')) {
                    owners = JSON.parse(ownersJson);
                } else {
                    owners = [{ ownerId: ownersJson, sharePercentage: 100, type: 'INDIVIDUAL' }];
                }
            } catch (e) {
                owners = [{ ownerId: 'UNKNOWN', sharePercentage: 100, type: 'INDIVIDUAL' }];
            }

            let spatialData = undefined;
            try {
                if (spatialDataJson && spatialDataJson.length > 2) {
                    spatialData = JSON.parse(spatialDataJson);
                }
            } catch (e) { }

            const newAsset = {
                ulpin,
                surveyNo: 'MOCK_SURVEY_' + Date.now().toString().slice(-4),
                status: 'FREE',
                landUseType: 'RESIDENTIAL',
                area: spatialData ? (spatialData.properties.calculatedAreaSqM / 10000) : 1000,
                geoJson,
                spatialData: spatialData,
                title: {
                    titleId: 'TITLE_' + ulpin,
                    owners: owners,
                    isConclusive: false
                },
                disputes: [],
                charges: []
            };
            this.mockLedger.set(ulpin, newAsset);
            return { success: true, txId: 'TX_CREATE_' + Date.now() };
        }

        if (functionName === 'initiateTransfer') {
            const [ulpin, sellerId, buyerId, share, price, utr] = args;
            const asset = this.mockLedger.get(ulpin);
            if (!asset) throw new Error(`Asset ${ulpin} not found`);

            asset.status = 'PENDING_MUTATION';
            // We store the pending transfer details in a separate 'pendingTransfer' field
            // to mimic the chaincode's behavior
            asset.pendingTransfer = {
                sellerId,
                buyerId,
                sharePercentage: Number(share),
                price: Number(price),
                paymentUtr: utr,
                timestamp: Date.now() // Mock current time
            };
            this.mockLedger.set(ulpin, asset);
            return { success: true, txId: 'TX_INIT_' + Date.now() };
        }

        if (functionName === 'approveMutation') {
            const [ulpin] = args;
            const asset = this.mockLedger.get(ulpin);

            if (!asset) return { success: false, message: 'Asset not found' };
            if (!asset.pendingTransfer) return { success: false, message: 'No pending transfer' };

            const { buyerId, sellerId, sharePercentage } = asset.pendingTransfer;

            // Logic mirrored from LandChainContract
            // Deduct from Seller
            const sellerIndex = asset.title.owners.findIndex(o => o.ownerId === sellerId);
            if (sellerIndex !== -1) {
                const sellerRecord = asset.title.owners[sellerIndex];
                sellerRecord.sharePercentage -= Number(sharePercentage);
                if (sellerRecord.sharePercentage <= 0) {
                    asset.title.owners.splice(sellerIndex, 1);
                }
            }

            // Add to Buyer
            const buyerIndex = asset.title.owners.findIndex(o => o.ownerId === buyerId);
            if (buyerIndex !== -1) {
                asset.title.owners[buyerIndex].sharePercentage += Number(sharePercentage);
            } else {
                asset.title.owners.push({ ownerId: buyerId, sharePercentage: Number(sharePercentage), type: 'INDIVIDUAL' });
            }

            delete asset.pendingTransfer;
            asset.status = 'FREE';

            this.mockLedger.set(ulpin, asset);
            return { success: true, txId: 'TX_APPROVE_' + Date.now() };
        }

        // Keep existing legacy mocks
        if (functionName === 'recordIntimation') {
            return { success: true, txId: 'MOCK_TX_' + Date.now(), message: `Intimation Recorded.` };
        }

        if (functionName === 'resolveDispute') {
            return {
                success: true,
                txId: 'MOCK_TX_' + Date.now(),
                endorsedBy: targetOrg,
                message: 'Dispute Resolved. Asset Unlocked.'
            };
        }

        // Simulate Endorsement Policy Routing
        // console.log(`[FabricService] Routing '${functionName}' to ${targetOrg} Peer for Endorsement...`);

        // Mock Response for Vibe Coding (since network isn't running)
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
        return 'MockPeer';
    }

    private getMockData(functionName: string, args: string[]) {
        if (functionName === 'getPaymentDetails') {
            const utr = args[0];
            // Simplified mock for payment details
            return { status: 'CONFIRMED', amount: 5000 };
        }

        if (functionName === 'queryByLegacyId') {
            const type = args[0];
            const value = args[1];

            // Mock Search Logic
            const mockDb = [
                { ulpin: 'MH12PUNE010001', legacy: { ctsNumber: '450/A', surveyNumber: '100' } },
                { ulpin: 'MH12JOINT001', legacy: { surveyNumber: '205/3' } },
                { ulpin: 'MH12FLAT101', legacy: { plotNumber: '101', propertyCardId: 'CARD_999' } }
            ];

            const results = mockDb.filter(m => m.legacy[type] === value);
            return results;
        }

        if (functionName === 'getParcel') {
            const ulpin = args[0];
            const asset = this.mockLedger.get(ulpin);
            if (asset) return asset;

            if (ulpin === 'MH12LOCK000001') {
                return {
                    ulpin: ulpin,
                    surveyNo: '100',
                    subDivision: '5',
                    landUseType: 'RESIDENTIAL',
                    area: 0.5,
                    status: 'LOCKED',
                    geoJson: 'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))',
                    title: {
                        titleId: 'TITLE_MH12LOCK000001',
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

            if (ulpin === 'MH12JOINT001') {
                return {
                    ulpin: ulpin,
                    surveyNo: '205/3',
                    subDivision: '0',
                    landUseType: 'AGRICULTURAL',
                    area: 4500.0,
                    status: 'FREE',
                    geoJson: 'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))',
                    title: {
                        titleId: 'TITLE_MH12JOINT001',
                        owners: [
                            { ownerId: 'BROTHER_1', sharePercentage: 50 },
                            { ownerId: 'BROTHER_2', sharePercentage: 50 }
                        ],
                        isConclusive: false
                    },
                    disputes: [],
                    charges: [],
                    legacyIdentifiers: {
                        surveyNumber: '205/3'
                    }
                };
            }

            if (ulpin === 'MH12DISPUTE001') {
                return {
                    ulpin: ulpin,
                    surveyNo: '66/A',
                    subDivision: '0',
                    landUseType: 'RESIDENTIAL',
                    area: 250.0,
                    status: 'LOCKED',
                    geoJson: 'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))',
                    title: {
                        titleId: 'TITLE_MH12DISPUTE001',
                        owners: [{ ownerId: 'PREV_OWNER_X', sharePercentage: 100 }],
                        isConclusive: true
                    },
                    disputes: [{
                        disputeId: 'DSP_CIVIL_2026_889',
                        type: 'TITLE_CLAIM',
                        status: 'ACTIVE',
                        courtParams: { courtId: 'CIVIL_COURT_PUNE', caseNumber: 'CCS/2026/889' }
                    }],
                    charges: []
                };
            }

            if (ulpin === 'MH12TRIBAL001') {
                return {
                    ulpin: ulpin,
                    surveyNo: '99/9',
                    subDivision: '0',
                    landUseType: 'AGRICULTURAL',
                    area: 20000.0,
                    status: 'FREE',
                    geoJson: 'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))',
                    title: {
                        titleId: 'TITLE_MH12TRIBAL001',
                        owners: [{ ownerId: 'TRIBAL_ELDER_1', sharePercentage: 100 }],
                        isConclusive: false
                    },
                    disputes: [],
                    charges: [],
                    metadata: { // Simulating Tribal Flag
                        isTribal: true
                    }
                };
            }

            if (ulpin === 'MH12FLAT101') {
                return {
                    ulpin: ulpin,
                    surveyNo: 'CitySurvey_101',
                    subDivision: 'Unit_101',
                    landUseType: 'RESIDENTIAL',
                    area: 85.0, // Sq M
                    status: 'FREE',
                    geoJson: 'POINT(18.5204 73.8567)',
                    title: {
                        titleId: 'TITLE_MH12FLAT101',
                        owners: [{ ownerId: 'FLAT_OWNER_Y', sharePercentage: 100 }],
                        isConclusive: true
                    },
                    disputes: [],
                    charges: [],
                    metadata: {
                        isStrata: true,
                        floor: 1,
                        uds: 25.5
                    },
                    legacyIdentifiers: {
                        plotNumber: '101',
                        propertyCardId: 'CARD_999'
                    }
                };
            }

            if (ulpin === 'MH12NA001') {
                return {
                    ulpin: ulpin,
                    surveyNo: '300/NA',
                    subDivision: '0',
                    landUseType: 'COMMERCIAL',
                    area: 5000.0,
                    status: 'FREE',
                    geoJson: 'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))',
                    title: {
                        titleId: 'TITLE_MH12NA001',
                        owners: [{ ownerId: 'MALL_DEVELOPER_LTD', sharePercentage: 100 }],
                        isConclusive: true
                    },
                    disputes: [],
                    charges: []
                };
            }

            // Throw error for unknown parcels to match Chaincode behavior
            throw new Error(`The parcel ${ulpin} does not exist`);
        }

        if (functionName === 'getPublicParcelDetails') {
            const ulpin = args[0];
            // Reuse getParcel logic for mock data
            const fullParcel = this.getMockData('getParcel', [ulpin]);

            // Redact it
            return {
                ulpin: fullParcel.ulpin,
                status: fullParcel.status,
                location: 'Available',
                ownerCount: fullParcel.title.owners.length,
                owners: [{ type: 'Redacted', share: 100 }],
                disputeStatus: 'Clear',
                mortgageStatus: 'Clear'
            };
        }

        if (functionName === 'queryPendingMutations') {
            // Filter ledger for PENDING_MUTATION
            const pending: any[] = [];
            this.mockLedger.forEach((value) => {
                if (value.status === 'PENDING_MUTATION') {
                    pending.push({
                        ulpin: value.ulpin,
                        surveyNo: value.surveyNo,
                        status: value.status,
                        mutationRequestTimestamp: value.pendingTransfer?.timestamp || Date.now(),
                        title: value.title,
                        metadata: { stampDuty: { amount: 5000, paidBy: 'MOCK', date: Date.now() } } // Mock metadata
                    });
                }
            });
            return pending;
        }

        if (functionName === 'GetParcelHistory') {
            return [
                {
                    txId: 'TX_GENESIS_001',
                    timestamp: { seconds: Math.floor((Date.now() - 100000000) / 1000) },
                    isDelete: false,
                    value: { status: 'FREE', title: { owners: [{ ownerId: 'GOVT_INITIAL' }] } }
                },
                {
                    txId: 'TX_SALE_002',
                    timestamp: { seconds: Math.floor((Date.now() - 50000000) / 1000) },
                    isDelete: false,
                    value: { status: 'FREE', title: { owners: [{ ownerId: 'PREV_OWNER_123' }] } }
                },
                {
                    txId: 'TX_MORTGAGE_003',
                    timestamp: { seconds: Math.floor((Date.now() - 100000) / 1000) },
                    isDelete: false,
                    value: { status: 'LOCKED', charges: [{ type: 'MORTGAGE' }] }
                }
            ];
        }

        return {};
    }
}
