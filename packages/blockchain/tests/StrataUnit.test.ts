import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { LandParcel } from '../src/assets/LandParcel';
import { StrataUnit } from '../src/assets/StrataUnit';

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

    describe('executeTransaction on StrataUnit', () => {
        it('should execute SALE on a StrataUnit', async () => {
            // Mock Strata Unit
            const unit = new StrataUnit();
            unit.unitId = 'UNIT_505';
            unit.parentParcelId = 'PARCEL_A';
            unit.status = 'FREE';
            unit.title = { owners: [{ ownerId: 'BUILDER', sharePercentage: 100 }] } as any;
            unit.ocDocumentHash = 'QmValidOCHash12345678901234567890123456789012'; // Added for Phase 29 RERA

            // Mock Parent as FREE
            mockStub.getState.withArgs('PARCEL_A').resolves(Buffer.from(JSON.stringify({ status: 'FREE' })));
            mockStub.getState.withArgs('UNIT_505').resolves(Buffer.from(JSON.stringify(unit)));

            await contract.executeTransaction(ctx, 'SALE', JSON.stringify({ parcelId: 'UNIT_505', buyerId: 'BUYER_1' }), '');

            // Verify Owner Update
            const putArgs = mockStub.putState.args[0];
            const updatedUnit = JSON.parse(putArgs[1].toString());
            expect(updatedUnit.title.owners[0].ownerId).to.equal('BUYER_1');
        });

        it('should block SALE if StrataUnit is LOCKED', async () => {
            const unit: any = {
                unitId: 'APT_LOCKED',
                status: 'LOCKED',
                title: { owners: [{ ownerId: 'OWNER', sharePercentage: 100 }] }
            };
            mockStub.getState.withArgs('APT_LOCKED').resolves(Buffer.from(JSON.stringify(unit)));

            try {
                await contract.executeTransaction(ctx, 'SALE', JSON.stringify({ parcelId: 'APT_LOCKED' }), 'HASH');
                expect.fail('Should fail');
            } catch (err: any) {
                expect(err.message).to.include('Asset is LOCKED');
            }
        });
    });
});
