import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { LandParcel } from '../src/assets/LandParcel';

describe('LandChainContract: Strata Titling', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: sinon.SinonStubbedInstance<ChaincodeStub>;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;
    });

    describe('createStrataUnit', () => {
        it('should create a Strata Unit if parent is FREE', async () => {
            // Mock Parent Parcel
            const parentParcel = new LandParcel();
            parentParcel.parcelId = 'PARCEL_PARENT_001';
            parentParcel.status = 'FREE';

            mockStub.getState.withArgs('PARCEL_PARENT_001').resolves(Buffer.from(JSON.stringify(parentParcel)));
            mockStub.getState.withArgs('APT_101').resolves(Buffer.from('')); // Unit doesn't exist

            const unit = await contract.createStrataUnit(ctx, 'APT_101', 'PARCEL_PARENT_001', 1, 1200, 'OWNER_APT_1');

            expect(unit.unitId).to.equal('APT_101');
            expect(unit.parentParcelId).to.equal('PARCEL_PARENT_001');
            expect(unit.floor).to.equal(1);
            expect(unit.title.owners[0].ownerId).to.equal('OWNER_APT_1');

            sinon.assert.calledWith(mockStub.putState, 'APT_101', sinon.match.any);
        });

        it('should fail if parent is LOCKED', async () => {
            const parentParcel = new LandParcel();
            parentParcel.parcelId = 'PARCEL_PARENT_001';
            parentParcel.status = 'LOCKED'; // e.g. Tax Default

            mockStub.getState.withArgs('PARCEL_PARENT_001').resolves(Buffer.from(JSON.stringify(parentParcel)));

            try {
                await contract.createStrataUnit(ctx, 'APT_101', 'PARCEL_PARENT_001', 1, 1200, 'OWNER_APT_1');
                expect.fail('Should have failed');
            } catch (err: any) {
                expect(err.message).to.include('Parent Parcel must be FREE');
            }
        });
    });
});
