
import * as sinon from 'sinon';
import * as chai from 'chai';
import { Context } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { LandParcel } from '../src/assets/LandParcel';

const sinonChai = require('sinon-chai');
chai.use(sinonChai.default || sinonChai);
const expect = chai.expect;

describe('Phase 33: NITI Aayog Refinements', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: any;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;
    });

    describe('Inheritance Share Validation', () => {
        it('should FAIL if heirs shares do not sum to 100%', async () => {
            const parcel = new LandParcel();
            parcel.parcelId = 'PARCEL_LEGACY';
            parcel.status = 'LOCKED_FOR_SUCCESSION';
            parcel.title = { owners: [{ ownerId: 'DECEASED', sharePercentage: 100 }] } as any;

            mockStub.getState.withArgs('PARCEL_LEGACY').resolves(Buffer.from(JSON.stringify(parcel)));

            const txData = {
                parcelId: 'PARCEL_LEGACY',
                heirs: [
                    { id: 'HEIR_1', share: 50 },
                    { id: 'HEIR_2', share: 40 } // Sum = 90
                ]
            };

            try {
                await contract.executeTransaction(ctx, 'INHERITANCE', JSON.stringify(txData), '');
                expect.fail('Should have failed validation');
            } catch (err: any) {
                expect(err.message).to.include('must sum to 100%');
            }
        });

        it('should PASS if heirs shares sum to 100%', async () => {
            const parcel = new LandParcel();
            parcel.parcelId = 'PARCEL_LEGACY';
            parcel.status = 'LOCKED_FOR_SUCCESSION';
            parcel.title = { owners: [{ ownerId: 'DECEASED', sharePercentage: 100 }] } as any;

            mockStub.getState.withArgs('PARCEL_LEGACY').resolves(Buffer.from(JSON.stringify(parcel)));

            const txData = {
                parcelId: 'PARCEL_LEGACY',
                heirs: [
                    { id: 'HEIR_1', share: 50 },
                    { id: 'HEIR_2', share: 50 }
                ]
            };

            await contract.executeTransaction(ctx, 'INHERITANCE', JSON.stringify(txData), '');

            // Check State update
            const putArgs = mockStub.putState.firstCall.args[1];
            const updated = JSON.parse(putArgs.toString());
            expect(updated.title.owners.length).to.equal(2);
        });
    });

    describe('Public Title Search', () => {
        it('should return REDACTED view', async () => {
            const parcel = new LandParcel();
            parcel.parcelId = 'PARCEL_PUB_1';
            parcel.status = 'FREE';
            parcel.area = 5.0;
            parcel.landUseType = 'RESIDENTIAL';
            parcel.title = { owners: [{ ownerId: 'PRIVATE_NAME', sharePercentage: 100 }] } as any;
            parcel.disputes = [];
            parcel.charges = [];

            mockStub.getState.withArgs('PARCEL_PUB_1').resolves(Buffer.from(JSON.stringify(parcel)));

            const resultStr = await contract.getPublicParcelDetails(ctx, 'PARCEL_PUB_1');
            const result = JSON.parse(resultStr);

            expect(result.parcelId).to.equal('PARCEL_PUB_1');
            expect(result.status).to.equal('FREE');
            expect(result.ownerCount).to.equal(1);
            // Verify Redaction
            expect(result.owners[0].type).to.equal('Redacted');
            expect(result.owners[0].ownerId).to.be.undefined;
        });
    });
});
