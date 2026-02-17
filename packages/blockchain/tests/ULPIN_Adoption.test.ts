
import * as sinon from 'sinon';
import * as chai from 'chai';
import { Context } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';

const sinonChai = require('sinon-chai');
chai.use(sinonChai.default || sinonChai);
const expect = chai.expect;

describe('Phase 35: ULPIN Adoption (Bhu-Aadhar)', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: any;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;
    });

    it('should ACCEPT a valid 14-digit ULPIN', async () => {
        const validULPIN = '12345678901234';
        const validIPFS = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'; // Valid 46 chars

        mockStub.getState.withArgs(validULPIN).resolves(Buffer.from('')); // Does not exist

        await contract.createParcel(ctx, validULPIN, 'OWNER', 'GEOJSON', validIPFS);

        const putCalls = mockStub.putState.getCalls();
        expect(putCalls.some((c: any) => c.args[0] === validULPIN)).to.be.true;
    });

    it('should REJECT an invalid ID (non-numeric, non-legacy)', async () => {
        const invalidID = 'MY_LAND_1'; // Not starting with PARCEL_, P, TEST
        const validIPFS = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';

        mockStub.getState.withArgs(invalidID).resolves(Buffer.from(''));

        try {
            await contract.createParcel(ctx, invalidID, 'OWNER', 'GEO', validIPFS);
            expect.fail('Should have failed validation');
        } catch (err: any) {
            expect(err.message).to.include('Invalid ULPIN');
        }
    });

    it('should ACCEPT legacy test IDs (Backward Compatibility)', async () => {
        const legacyID = 'MH12LEGACY0001';
        const validIPFS = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';

        mockStub.getState.withArgs(legacyID).resolves(Buffer.from(''));

        await contract.createParcel(ctx, legacyID, 'OWNER', 'GEO', validIPFS);

        const putCalls = mockStub.putState.getCalls();
        expect(putCalls.some((c: any) => c.args[0] === legacyID)).to.be.true;
    });
});
