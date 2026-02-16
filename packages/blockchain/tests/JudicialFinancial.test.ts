
import * as sin from 'sinon';
import * as chai from 'chai';
import { Context } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { LandParcel } from '../src/assets/LandParcel';
import { TitleRecord } from '../src/assets/TitleRecord';
import { ChargeRecord } from '../src/assets/ChargeRecord';

const sinonChai = require('sinon-chai');
chai.use(sinonChai.default || sinonChai);
const expect = chai.expect;
const sinon = require('sinon');

describe('Judicial & Financial Locks', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: any;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;
    });

    const createMockParcel = (id: string, owner: string): LandParcel => {
        return {
            ulpin: id,
            surveyNo: '100',
            subDivision: '0',
            landUseType: 'NON_AGRICULTURAL',
            area: 10,
            geoJson: 'POLYGON(...)',
            status: 'FREE',
            title: {
                titleId: `TITLE_${id}`,
                ulpin: id,
                owners: [{ ownerId: owner, sharePercentage: 100 }],
                isConclusive: true,
                publicationDate: Date.now()
            } as TitleRecord,
            disputes: [],
            charges: [],
            docHash: 'HASH',
            landCategory: 'GENERAL',
            tenureType: 'OCCUPANCY_CLASS_1',
            isTribalProtected: false,
            isWakf: false,
            isForestCRZ: false,
            localMeasurementUnit: 'GUNTHA',
            localMeasurementValue: 0,
            mutationRequestTimestamp: 0,
            ulpinPNIU: ''
        };
    };

    it('should lock parcel upon Mortgage creation', async () => {
        const p1 = createMockParcel('P1', 'USER_1');
        mockStub.getState.withArgs('P1').resolves(Buffer.from(JSON.stringify(p1)));

        // Call recordIntimation directly as it is the entry point for charges
        await contract.recordIntimation(ctx, 'P1', 'CHARGE', 'MORTGAGE', 'SBI_BANK', 'Loan 123');

        const putCall = mockStub.putState.withArgs('P1').firstCall;
        const updated = JSON.parse(putCall.args[1].toString());
        expect(updated.status).to.equal('LOCKED');
        expect(updated.charges.length).to.equal(1);
        expect(updated.charges[0].active).to.be.true;
    });

    it('should unlock parcel when Mortgage is released', async () => {
        const p1 = createMockParcel('P1', 'USER_1');
        p1.status = 'LOCKED';
        p1.charges = [{
            chargeId: 'CHG_1',
            ulpin: 'P1',
            type: 'MORTGAGE',
            holder: 'SBI_BANK',
            amount: 1000,
            active: true
        } as ChargeRecord];

        mockStub.getState.withArgs('P1').resolves(Buffer.from(JSON.stringify(p1)));

        // Unlock
        await contract.executeTransaction(ctx, 'UNLOCK_CHARGE', JSON.stringify({ ulpin: 'P1', chargeId: 'CHG_1' }), '');

        const putCall = mockStub.putState.withArgs('P1').firstCall;
        const updated = JSON.parse(putCall.args[1].toString());
        expect(updated.status).to.equal('FREE');
        expect(updated.charges[0].active).to.be.false;
    });

    it('should REMAIN locked if another Lock exists (e.g. Litigation)', async () => {
        const p1 = createMockParcel('P1', 'USER_1');
        p1.status = 'LITIGATION';
        // Has Mortgage AND Dispute
        p1.charges = [{
            chargeId: 'CHG_1',
            ulpin: 'P1',
            type: 'MORTGAGE',
            holder: 'SBI_BANK',
            amount: 1000,
            active: true
        } as ChargeRecord];
        p1.disputes = [{
            disputeId: 'DSP_1',
            ulpin: 'P1',
            courtId: 'CIVIL_COURT',
            type: 'TITLE_SUIT',
            status: 'PENDING'
        } as any];

        mockStub.getState.withArgs('P1').resolves(Buffer.from(JSON.stringify(p1)));

        // Unlock Mortgage
        await contract.executeTransaction(ctx, 'UNLOCK_CHARGE', JSON.stringify({ ulpin: 'P1', chargeId: 'CHG_1' }), '');

        const putCall = mockStub.putState.withArgs('P1').firstCall;
        const updated = JSON.parse(putCall.args[1].toString());

        // Should NOT be FREE because Dispute is still PENDING
        // Note: Logic in UNLOCK_CHARGE checks if pending disputes exist.
        // It does NOT explicitly check if status was LITIGATION, it just infers new status.
        // If disputes exist, it won't set to FREE. It stays whatever it was or becomes LOCKED/LITIGATION?
        // My current logic only resets to FREE if strictly empty. It doesn't force "LITIGATION" if it was "LOCKED".
        // Wait, if it was LOCKED, and we unlock mortgage, but dispute is there...
        // The Status variable is singular. It serves as "Highest Priority State".
        // LITIGATION > LOCKED > FREE.
        // If I unlock Mortgage, but Dispute is there, effectively it serves as "LOCKED" (cannot transfer).
        // Let's see what logic I wrote.

        expect(updated.charges[0].active).to.be.false;
        expect(updated.status).to.not.equal('FREE');
    });
});
