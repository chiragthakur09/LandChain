
import * as sinon from 'sinon';
import * as chai from 'chai';
import { Context } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { LandParcel } from '../src/assets/LandParcel';

const sinonChai = require('sinon-chai');
chai.use(sinonChai.default || sinonChai);
const expect = chai.expect;

describe('Indian Lifecycle Workflows', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: sinon.SinonStubbedInstance<ChaincodeStub>;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;
    });

    it('should register Agreement to Sale (ATS) and lock state', async () => {
        const parcel = new LandParcel();
        parcel.ulpin = 'P100';
        parcel.status = 'FREE';

        mockStub.getState.withArgs('P100').resolves(Buffer.from(JSON.stringify(parcel)));

        await contract.executeTransaction(ctx, 'REGISTER_ATS', JSON.stringify({
            ulpin: 'P100', buyerId: 'BUYER_X'
        }), '');

        expect(mockStub.putState).to.have.been.called;
        const args = mockStub.putState.getCall(0).args;
        const updated = JSON.parse(args[1].toString());
        expect(updated.status).to.equal('PENDING_ATS');
    });

    it('should lock property for Succession upon Death Intimation', async () => {
        const parcel = new LandParcel();
        parcel.ulpin = 'P200';
        parcel.status = 'FREE';

        mockStub.getState.withArgs('P200').resolves(Buffer.from(JSON.stringify(parcel)));

        await contract.executeTransaction(ctx, 'INTIMATE_DEATH', JSON.stringify({
            ulpin: 'P200', deceasedOwnerId: 'OWNER_OLD'
        }), '');

        const args = mockStub.putState.getCall(0).args;
        const updated = JSON.parse(args[1].toString());
        expect(updated.status).to.equal('LOCKED_FOR_SUCCESSION');
    });

    it('should retire Parent Asset after Partition', async () => {
        const parcel = new LandParcel();
        parcel.ulpin = 'P300';
        parcel.status = 'FREE';

        mockStub.getState.withArgs('P300').resolves(Buffer.from(JSON.stringify(parcel)));

        await contract.executeTransaction(ctx, 'FINALIZE_PARTITION', JSON.stringify({
            ulpin: 'P300'
        }), '');

        const args = mockStub.putState.getCall(0).args;
        const updated = JSON.parse(args[1].toString());
        expect(updated.status).to.equal('RETIRED');
    });

    it('should process Gift as a Transfer triggering Mutation', async () => {
        const parcel = new LandParcel();
        parcel.ulpin = 'P400';
        parcel.status = 'FREE';
        parcel.title = { owners: [], isConclusive: true } as any;

        mockStub.getState.withArgs('P400').resolves(Buffer.from(JSON.stringify(parcel)));

        await contract.executeTransaction(ctx, 'GIFT', JSON.stringify({
            ulpin: 'P400', doneeId: 'FAMILY_MEMBER'
        }), '');

        const args = mockStub.putState.getCall(0).args;
        const updated = JSON.parse(args[1].toString());

        expect(updated.status).to.equal('PENDING_SCRUTINY'); // Mutation flow
        expect(updated.title.owners[0].ownerId).to.equal('FAMILY_MEMBER');
        expect(updated.mutationRequestTimestamp).to.be.greaterThan(0);
    });
});
