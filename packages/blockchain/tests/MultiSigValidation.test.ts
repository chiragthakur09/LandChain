import { Context } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { LandParcel } from '../src/assets/LandParcel';

describe('Real World Nuances (Multi-Sig Explicit)', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: sinon.SinonStubbedInstance<ChaincodeStub>;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;
    });

    it('should block 100% sale if multiple owners exist (true Multi-Sig constraint)', async () => {
        const parcel = new LandParcel();
        parcel.ulpin = 'P1';
        // Case where A owns 100% but somehow B is also an owner? That's invalid state.
        // Real Multi-Sig case: A owns 50%, B owns 50%. A tries to sell 100%? Caught by insufficient share.
        // The ONLY way Multi-Sig logic triggers is if A owns 100%... wait.
        // If A owns 100%, then owners.length is 1. The check `sharePercentage === 100 && owners.length > 1` is unreachable 
        // unless we have a different definition of "joint owners" where shares don't sum to 100? No.

        // Correction: The only way this triggers is if A tries to sell 100% of the PROPERTY, 
        // but A only owns 50%. But that is caught by check #3 (insufficient share).

        // So when does the Multi-Sig check actually run?
        // It implies "Selling the Whole Property" vs "Selling my Share".
        // If A owns 50%, they can't sell 100%.
        // If A owns 100% (and owners.length > 1), that's impossible mathematically.

        // Ah, maybe the check is redundant if check #3 exists?
        // Unless we allow "Authorized Representative" selling on behalf of all? No.

        // Wait, unless A is trying to sell "100% of THEIR share" which is different from "100% of Parcel"?
        // No, the API argument `sharePercentage` is "% of Parcel".

        // So the Multi-Sig check `sharePercentage === 100 && owners.length > 1` is effectively dead code 
        // because check #3 `sellerRecord.sharePercentage < sharePercentage` will always fire first
        // if there are multiple owners (since no single owner can have 100% if there are others).

        // UNLESS: Data corruption where shares > 100%? Unlikely.

        // REDESIGN: The Multi-Sig check is useful if we allowed PROPOSING a 100% sale that others sign later.
        // But for this atomic function, Check #3 covers it.

        // Let's create a test that verifies Check #3 behaves AS the "Joint Holding Protection".

        parcel.title = {
            titleId: 'T1', ulpin: 'P1',
            owners: [{ ownerId: 'A', sharePercentage: 50 }, { ownerId: 'B', sharePercentage: 50 }],
            isConclusive: true, publicationDate: Date.now()
        };
        parcel.disputes = [];
        parcel.charges = [];

        mockStub.getState.callsFake(async (key: string) => {
            if (key === 'P1') return Buffer.from(JSON.stringify(parcel));
            return Buffer.alloc(0);
        });

        try {
            await contract.initiateTransfer(ctx, 'P1', 'A', 'BUYER', 100, 1000000, 'UTR_MS_FAIL');
            expect.fail('Should have blocked 100% sale');
        } catch (err: any) {
            expect(err.message).to.include('Seller only owns 50%');
        }
    });
});
