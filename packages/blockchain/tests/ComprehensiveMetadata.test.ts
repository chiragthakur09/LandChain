
import * as sinon from 'sinon';
import * as chai from 'chai';
import { Context } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { LandParcel } from '../src/assets/LandParcel';

const sinonChai = require('sinon-chai');
chai.use(sinonChai.default || sinonChai);
const expect = chai.expect;

describe('Phase 34: Comprehensive Transaction Metadata', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: any;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;
    });

    describe('transferParcel with Metadata', () => {
        it('should store Stamp Duty and Witness details in TitleRecord', async () => {
            const parcel = new LandParcel();
            parcel.parcelId = 'MH12META000001';
            parcel.status = 'FREE';
            parcel.title = {
                titleId: 'TITLE_001',
                parcelId: 'MH12META000001',
                owners: [{ ownerId: 'SELLER', sharePercentage: 100 }],
                isConclusive: true,
                publicationDate: 0
            } as any;
            parcel.disputes = [];
            parcel.charges = [];

            mockStub.getState.withArgs('MH12META000001').resolves(Buffer.from(JSON.stringify(parcel)));

            const metadata = {
                stampDuty: {
                    challanNo: 'CHALLAN_001',
                    amount: 50000,
                    date: Date.now()
                },
                witnesses: ['WITNESS_1_HASH', 'WITNESS_2_HASH']
            };

            await contract.transferParcel(ctx, 'MH12META000001', 'SELLER', 'BUYER', 100, 1000000, 'UTR_META_1', JSON.stringify(metadata));

            const calls = mockStub.putState.getCalls();
            // Find MH12META000001 putState
            const parcelCall = calls.find((c: any) => c.args[0] === 'MH12META000001');
            if (!parcelCall) {
                throw new Error(`PutState for MH12META000001 not called. Calls: ${calls.map((c: any) => c.args[0]).join(', ')}`);
            }

            const jsonString = parcelCall.args[1].toString();
            // DEBUG LOG
            // console.log('DEBUG_JSON:', jsonString); 

            const updatedParcel = JSON.parse(jsonString);

            if (!updatedParcel.title) {
                throw new Error('updatedParcel.title is undefined. JSON: ' + jsonString);
            }

            if (!updatedParcel.title.lastTransaction) {
                throw new Error('updatedParcel.title.lastTransaction is undefined. Title keys: ' + Object.keys(updatedParcel.title).join(', '));
            }

            expect(updatedParcel.title.lastTransaction.stampDutyChallan).to.equal('CHALLAN_001');
            expect(updatedParcel.title.lastTransaction.stampDutyAmount).to.equal(50000);
            expect(updatedParcel.title.lastTransaction.witnesses).to.have.lengthOf(2);
            expect(updatedParcel.title.lastTransaction.witnesses[0]).to.equal('WITNESS_1_HASH');
        });

        it('should validate Stamp Duty Amount', async () => {
            const parcel = new LandParcel();
            parcel.parcelId = 'MH12META000002';
            parcel.status = 'FREE';
            parcel.title = { owners: [{ ownerId: 'SELLER', sharePercentage: 100 }] } as any;
            parcel.disputes = [];
            parcel.charges = [];

            mockStub.getState.withArgs('MH12META000002').resolves(Buffer.from(JSON.stringify(parcel)));

            const metadata = {
                stampDuty: {
                    challanNo: 'CHALLAN_INVALID',
                    amount: 0, // Invalid
                    date: Date.now()
                }
            };

            try {
                await contract.transferParcel(ctx, 'MH12META000002', 'SELLER', 'BUYER', 100, 1000000, 'UTR_META_2', JSON.stringify(metadata));
                expect.fail('Should have failed validation');
            } catch (err: any) {
                expect(err.message).to.include('Stamp Duty Amount must be positive');
            }
        });
    });
});
