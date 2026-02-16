
import * as sinon from 'sinon';
import * as chai from 'chai';
import { Context } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { AdminValidator } from '../src/logic/AdminValidator';
import { LandParcel } from '../src/assets/LandParcel';

const sinonChai = require('sinon-chai');
chai.use(sinonChai.default || sinonChai);
const expect = chai.expect;

describe('Phase 22 Logic: Timers & Admin Validation', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: sinon.SinonStubbedInstance<ChaincodeStub>;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;
    });

    describe('AdminValidator', () => {
        it('should block Tribal Land transfer without DC Approval', async () => {
            const parcel = new LandParcel();
            parcel.isTribalProtected = true;
            parcel.landCategory = 'GENERAL';

            try {
                await AdminValidator.validateTribalTransfer(ctx, parcel, {});
                expect.fail('Should have thrown error');
            } catch (err: any) {
                expect(err.message).to.include('Restricted: Tribal Land transfer requires District Collector (DC) Approval');
            }
        });

        it('should block transfer if category is TRIBAL_SCHEDULED even if flag is false', async () => {
            const parcel = new LandParcel();
            parcel.isTribalProtected = false;
            parcel.landCategory = 'TRIBAL_SCHEDULED';

            try {
                await AdminValidator.validateTribalTransfer(ctx, parcel, {});
                expect.fail('Should have thrown error');
            } catch (err: any) {
                expect(err.message).to.include('Restricted: Tribal Land transfer requires District Collector (DC) Approval');
            }
        });

        it('should allow Tribal Land transfer with DC Approval Hash', async () => {
            const parcel = new LandParcel();
            parcel.isTribalProtected = true;

            await AdminValidator.validateTribalTransfer(ctx, parcel, { dcApprovalHash: 'SIGNED_BY_DC' });
        });

        it('should strictly block Wakf Land transfer', async () => {
            const wakfParcel = new LandParcel();
            wakfParcel.isWakf = true;

            try {
                await AdminValidator.validateTribalTransfer(ctx as any, wakfParcel, {});
                expect.fail('Should have blocked Wakf transfer');
            } catch (err: any) {
                expect(err.message).to.include('Wakf properties are LOCKED_FOR_ENDOWMENT');
            }
        });
    });

    describe('Mutation Timer (approveMutation)', () => {
        it('should block early approval (< 30 days)', async () => {
            const parcel = new LandParcel();
            parcel.status = 'PENDING_SCRUTINY';
            parcel.mutationRequestTimestamp = Date.now(); // Just started

            mockStub.getState.resolves(Buffer.from(JSON.stringify(parcel)));

            try {
                await contract.executeTransaction(ctx, 'APPROVE_MUTATION', JSON.stringify({ parcelId: 'P1' }), '');
                expect.fail('Should have blocked early approval');
            } catch (err: any) {
                expect(err.message).to.include('Scrutiny Period Active');
            }
        });

        it('should approve after 30 days', async () => {
            const parcel = new LandParcel();
            parcel.status = 'PENDING_SCRUTINY';
            // Set timestamp to 31 days ago
            parcel.mutationRequestTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000);

            mockStub.getState.resolves(Buffer.from(JSON.stringify(parcel)));

            await contract.executeTransaction(ctx, 'APPROVE_MUTATION', JSON.stringify({ parcelId: 'P1' }), '');

            // Verify update
            expect(mockStub.putState).to.have.been.called;
            const args = mockStub.putState.getCall(0).args;
            const updatedParcel = JSON.parse(args[1].toString());
            expect(updatedParcel.status).to.equal('FREE');
            expect(updatedParcel.mutationRequestTimestamp).to.equal(0);
        });
    });
});
