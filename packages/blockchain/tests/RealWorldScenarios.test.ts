
import * as sinon from 'sinon';
import * as chai from 'chai';
import { Context } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { LandParcel } from '../src/assets/LandParcel';
import { StrataUnit } from '../src/assets/StrataUnit';
import { AdminValidator } from '../src/logic/AdminValidator';

const sinonChai = require('sinon-chai');
chai.use(sinonChai.default || sinonChai);
const expect = chai.expect;

describe('Real World Scenarios (RERA, Forest, Strata)', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: sinon.SinonStubbedInstance<ChaincodeStub>;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;
    });

    describe('RERA Compliance (Strata Units)', () => {
        it('should Block Sale of Strata Unit without Occupancy Certificate (OC)', async () => {
            const unit = new StrataUnit();
            unit.ulpin = 'MH12FLT0000101';
            unit.parentUlpin = 'MH12PAR0000001';
            unit.status = 'FREE';
            unit.ocDocumentHash = ''; // No OC
            unit.reraRegistrationNumber = 'RERA_123';

            // Mock fetching the unit
            mockStub.getState.withArgs('MH12FLT0000101').resolves(Buffer.from(JSON.stringify(unit)));
            mockStub.getState.withArgs('MH12PAR0000001').resolves(Buffer.from(JSON.stringify({ status: 'FREE' })));

            try {
                await contract.executeTransaction(ctx, 'SALE', JSON.stringify({ ulpin: 'MH12FLT0000101', buyerId: 'B1' }), '');
                expect.fail('Should have blocked sale without OC');
            } catch (err: any) {
                expect(err.message).to.include('without Occupancy Certificate');
            }
        });

        it('should Allow Sale of Strata Unit WITH Occupancy Certificate', async () => {
            const unit = new StrataUnit();
            unit.ulpin = 'MH12FLT0000102';
            unit.parentUlpin = 'MH12PAR0000001';
            unit.status = 'FREE';
            unit.ocDocumentHash = 'OC_HASH_XYZ'; // Has OC
            unit.title = { owners: [{ ownerId: 'BUILDER', sharePercentage: 100 }], isConclusive: false } as any;

            mockStub.getState.withArgs('MH12FLT0000102').resolves(Buffer.from(JSON.stringify(unit)));
            mockStub.getState.withArgs('MH12PAR0000001').resolves(Buffer.from(JSON.stringify({ status: 'FREE' })));

            await contract.executeTransaction(ctx, 'SALE', JSON.stringify({ ulpin: 'MH12FLT0000102', buyerId: 'BUYER_1' }), '');

            // Should succeed and update state
            expect(mockStub.putState).to.have.been.called;
        });
    });

    describe('Forest & Tribal Protection (Conversion)', () => {
        it('should Block Conversion of Forest Land', async () => {
            const parcel = new LandParcel();
            parcel.ulpin = 'MH12FRS0000001';
            parcel.status = 'FREE';
            parcel.landUseType = 'FOREST'; // Already Forest
            parcel.isForestCRZ = true;

            mockStub.getState.withArgs('MH12FRS0000001').resolves(Buffer.from(JSON.stringify(parcel)));

            try {
                // Attempt to convert Forest to Residential
                await contract.executeTransaction(ctx, 'CONVERSION', JSON.stringify({ ulpin: 'MH12FRS0000001', newUse: 'RESIDENTIAL' }), '');
                expect.fail('Should have blocked Forest conversion');
            } catch (err: any) {
                expect(err.message).to.include('Restricted');
            }
        });
    });

    describe('Strata vs Parent Land Disputes', () => {
        it('should Block Strata Sale if Parent Land is under Litigation', async () => {
            // Mock Parent Land as LITIGATION
            const parentLand = new LandParcel();
            parentLand.ulpin = 'MH12PAR0000001';
            parentLand.status = 'LITIGATION';

            // Mock Strata Unit
            const unit = new StrataUnit();
            unit.ulpin = 'MH12FLT0000202';
            unit.parentUlpin = 'MH12PAR0000001';
            unit.status = 'FREE';
            unit.ocDocumentHash = 'VALID_OC_HASH'; // Bypass RERA check

            // Stub both calls
            mockStub.getState.withArgs('MH12FLT0000202').resolves(Buffer.from(JSON.stringify(unit)));
            mockStub.getState.withArgs('MH12PAR0000001').resolves(Buffer.from(JSON.stringify(parentLand)));

            try {
                // Attempt to sell Flat
                await contract.executeTransaction(ctx, 'SALE', JSON.stringify({ ulpin: 'MH12FLT0000202', buyerId: 'B2' }), '');
                expect.fail('Should have blocked Strata Sale due to Parent Litigation');
            } catch (err: any) {
                expect(err.message).to.include('Operation Blocked');
                expect(err.message).to.include('is NOT Free');
            }
        });
    });

});
