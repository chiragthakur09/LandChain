import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { LandParcel } from '../src/assets/LandParcel';

describe('LandChainContract', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: sinon.SinonStubbedInstance<ChaincodeStub>;
    let mockClientIdentity: sinon.SinonStubbedInstance<ClientIdentity>;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();

        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;

        mockClientIdentity = sinon.createStubInstance(ClientIdentity);
        ctx.clientIdentity = mockClientIdentity;
    });

    describe('createParcel', () => {
        it('should create a parcel successfully', async () => {
            mockStub.getState.resolves(Buffer.from('')); // Parcel does not exist

            const parcel = await contract.createParcel(ctx, 'PARCEL_TEST_001', 'OWNER_001', 'POLYGON((0 0))', 'DOC_HASH_001');

            expect(parcel.parcelId).to.equal('PARCEL_TEST_001');
            expect(parcel.status).to.equal('FREE');
            expect(parcel.title.titleId).to.equal('TITLE_PARCEL_TEST_001');
            expect(parcel.title.owners[0].ownerId).to.equal('OWNER_001');

            sinon.assert.calledWith(mockStub.putState, 'PARCEL_TEST_001', sinon.match.any);
        });

        it('should throw error if parcel already exists', async () => {
            mockStub.getState.resolves(Buffer.from('{"parcelId": "PARCEL_TEST_001"}'));

            try {
                await contract.createParcel(ctx, 'PARCEL_TEST_001', 'OWNER_001', 'POLYGON((0 0))', 'DOC_HASH_001');
                expect.fail('Should have thrown error');
            } catch (err: any) {
                expect(err.message).to.include('already exists');
            }
        });
    });

    describe('recordIntimation', () => {
        it('should record a MORTGAGE charge and lock the parcel', async () => {
            const existingParcel = new LandParcel();
            existingParcel.parcelId = 'PARCEL_TEST_001';
            existingParcel.status = 'FREE';
            existingParcel.charges = [];
            existingParcel.disputes = [];

            mockStub.getState.resolves(Buffer.from(JSON.stringify(existingParcel)));

            await contract.recordIntimation(ctx, 'PARCEL_TEST_001', 'CHARGE', 'MORTGAGE', 'BANK_001', 'Loan 123');

            // Capture the updated state
            const putStateArgs = mockStub.putState.getCall(0).args;
            const updatedParcel = JSON.parse(putStateArgs[1].toString());

            expect(updatedParcel.status).to.equal('LOCKED');
            expect(updatedParcel.charges).to.have.lengthOf(1);
            expect(updatedParcel.charges[0].type).to.equal('MORTGAGE');
            expect(updatedParcel.charges[0].holder).to.equal('BANK_001');
        });

        it('should record a DISPUTE and set status to LITIGATION', async () => {
            const existingParcel = new LandParcel();
            existingParcel.parcelId = 'PARCEL_TEST_001';
            existingParcel.status = 'FREE';
            existingParcel.charges = [];
            existingParcel.disputes = [];

            mockStub.getState.resolves(Buffer.from(JSON.stringify(existingParcel)));

            await contract.recordIntimation(ctx, 'PARCEL_TEST_001', 'DISPUTE', 'CIVIL_SUIT', 'COURT_001', 'Case 456');

            // Capture the updated state
            const putStateArgs = mockStub.putState.getCall(0).args;
            const updatedParcel = JSON.parse(putStateArgs[1].toString());

            expect(updatedParcel.status).to.equal('LITIGATION');
            expect(updatedParcel.disputes).to.have.lengthOf(1);
            expect(updatedParcel.disputes[0].type).to.equal('CIVIL_SUIT');
        });
    });

    describe('transferParcel', () => {
        it('should transfer parcel if no bad records exist', async () => {
            const existingParcel = new LandParcel();
            existingParcel.parcelId = 'PARCEL_TEST_001';
            existingParcel.status = 'FREE';
            existingParcel.title = { titleId: 'T1', parcelId: 'PARCEL_TEST_001', owners: [{ ownerId: 'OLD_OWNER', sharePercentage: 100 }], isConclusive: false, publicationDate: Date.now() };
            existingParcel.charges = [];
            existingParcel.disputes = [];

            mockStub.getState.resolves(Buffer.from(JSON.stringify(existingParcel)));

            await contract.transferParcel(ctx, 'PARCEL_TEST_001', 'OLD_OWNER', 'NEW_OWNER', 100, 1000);

            const putStateArgs = mockStub.putState.getCall(0).args;
            const updatedParcel = JSON.parse(putStateArgs[1].toString());

            expect(updatedParcel.title.owners[0].ownerId).to.equal('NEW_OWNER');
        });

        it('should fail transfer if active Mortgage exists', async () => {
            const existingParcel = new LandParcel();
            existingParcel.parcelId = 'PARCEL_TEST_001';
            existingParcel.status = 'LOCKED';
            existingParcel.title = { titleId: 'T1', parcelId: 'PARCEL_TEST_001', owners: [{ ownerId: 'OLD_OWNER', sharePercentage: 100 }], isConclusive: false, publicationDate: Date.now() };
            existingParcel.charges = [{ chargeId: 'C1', parcelId: 'PARCEL_TEST_001', type: 'MORTGAGE', holder: 'BANK', amount: 100, active: true, timestamp: Date.now() }];
            existingParcel.disputes = [];

            mockStub.getState.resolves(Buffer.from(JSON.stringify(existingParcel)));

            try {
                await contract.transferParcel(ctx, 'PARCEL_TEST_001', 'OLD_OWNER', 'NEW_OWNER', 100, 1000);
                expect.fail('Should have failed due to Mortgage');
            } catch (err: any) {
                expect(err.message).to.include('Transfer Denied');
            }
        });
    });

    describe('finalizeTitle', () => {
        it('should finalize title if no disputes', async () => {
            const existingParcel = new LandParcel();
            existingParcel.parcelId = 'PARCEL_TEST_001';
            existingParcel.title = { titleId: 'T1', parcelId: 'PARCEL_TEST_001', owners: [{ ownerId: 'OWNER', sharePercentage: 100 }], isConclusive: false, publicationDate: Date.now() - (1000 * 60 * 60 * 24 * 365 * 4) }; // 4 years ago
            existingParcel.charges = [];
            existingParcel.disputes = [];

            mockStub.getState.resolves(Buffer.from(JSON.stringify(existingParcel)));

            await contract.finalizeTitle(ctx, 'PARCEL_TEST_001');

            const putStateArgs = mockStub.putState.getCall(0).args;
            const updatedParcel = JSON.parse(putStateArgs[1].toString());

            expect(updatedParcel.title.isConclusive).to.be.true;
            sinon.assert.calledWith(mockStub.setEvent, 'TitleFinalized', sinon.match.any);
        });

        it('should fail to finalize if disputes exist', async () => {
            const existingParcel = new LandParcel();
            existingParcel.parcelId = 'PARCEL_TEST_001';
            existingParcel.title = { titleId: 'T1', parcelId: 'PARCEL_TEST_001', owners: [{ ownerId: 'OWNER', sharePercentage: 100 }], isConclusive: false, publicationDate: Date.now() - (1000 * 60 * 60 * 24 * 365 * 4) };
            existingParcel.charges = [];
            existingParcel.disputes = [{ disputeId: 'D1', parcelId: 'PARCEL_TEST_001', courtId: 'COURT', type: 'CIVIL_SUIT', status: 'PENDING', timestamp: Date.now() }];

            mockStub.getState.resolves(Buffer.from(JSON.stringify(existingParcel)));

            try {
                await contract.finalizeTitle(ctx, 'PARCEL_TEST_001');
                expect.fail('Should have failed due to disputes');
            } catch (err: any) {
                expect(err.message).to.include('pending disputes');
            }
        });
    });
});
