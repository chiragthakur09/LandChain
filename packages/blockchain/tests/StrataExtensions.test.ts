
import * as sin from 'sinon';
import * as chai from 'chai';
import { Context } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { LandParcel } from '../src/assets/LandParcel';
import { StrataUnit } from '../src/assets/StrataUnit';
import { TitleRecord } from '../src/assets/TitleRecord';

const sinonChai = require('sinon-chai');
chai.use(sinonChai.default || sinonChai);
const expect = chai.expect;
const sinon = require('sinon');

describe('Strata Extensions (Checklist)', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: any;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;
    });

    const createMockParent = (id: string, status: 'FREE' | 'LOCKED' | 'LITIGATION' | 'RETIRED'): LandParcel => {
        return {
            ulpin: id,
            status: status,
            title: { owners: [{ ownerId: 'BUILDER', sharePercentage: 100 }] } as any,
            // ... minimal other fields
        } as LandParcel;
    };

    const createMockUnit = (id: string, parentId: string): StrataUnit => {
        return {
            ulpin: id,
            parentUlpin: parentId,
            status: 'FREE',
            title: { owners: [{ ownerId: 'OWNER_1', sharePercentage: 100 }] } as any,
            ocDocumentHash: 'QmValidOC', // Ensure RERA Check passes
            reraRegistrationNumber: 'P123456789012'
        } as StrataUnit;
    };

    it('should BLOCK sale of Unit if Parent Land is LOCKED (Mortgage)', async () => {
        const parent = createMockParent('MH12PAR0000001', 'LOCKED');
        const unit = createMockUnit('MH12UNT0000101', 'MH12PAR0000001');

        mockStub.getState.withArgs('MH12UNT0000101').resolves(Buffer.from(JSON.stringify(unit)));
        mockStub.getState.withArgs('MH12PAR0000001').resolves(Buffer.from(JSON.stringify(parent)));

        const txData = { ulpin: 'MH12UNT0000101', buyerId: 'BUYER_1', price: 5000000, share: 100 };

        try {
            await contract.executeTransaction(ctx, 'SALE', JSON.stringify(txData), '');
            expect.fail('Should have thrown error');
        } catch (err: any) {
            expect(err.message).to.include('Parent Land (MH12PAR0000001) is NOT Free');
            expect(err.message).to.include('LOCKED');
        }
    });

    it('should BLOCK sale of Unit if Parent Land is RETIRED', async () => {
        const parent = createMockParent('MH12PAR0000001', 'RETIRED');
        const unit = createMockUnit('MH12UNT0000101', 'MH12PAR0000001');

        mockStub.getState.withArgs('MH12UNT0000101').resolves(Buffer.from(JSON.stringify(unit)));
        mockStub.getState.withArgs('MH12PAR0000001').resolves(Buffer.from(JSON.stringify(parent)));

        const txData = { ulpin: 'MH12UNT0000101', buyerId: 'BUYER_1', price: 5000000, share: 100 };

        try {
            await contract.executeTransaction(ctx, 'SALE', JSON.stringify(txData), '');
            expect.fail('Should have thrown error');
        } catch (err: any) {
            expect(err.message).to.include('Parent Land (MH12PAR0000001) is NOT Free');
            expect(err.message).to.include('RETIRED');
        }
    });

    it('should ALLOW sale if Parent is FREE', async () => {
        const parent = createMockParent('MH12PAR0000001', 'FREE');
        const unit = createMockUnit('MH12UNT0000101', 'MH12PAR0000001');

        mockStub.getState.withArgs('MH12UNT0000101').resolves(Buffer.from(JSON.stringify(unit)));
        mockStub.getState.withArgs('MH12PAR0000001').resolves(Buffer.from(JSON.stringify(parent)));

        const txData = { ulpin: 'MH12UNT0000101', buyerId: 'BUYER_1', price: 5000000, share: 100 };

        await contract.executeTransaction(ctx, 'SALE', JSON.stringify(txData), '');

        // Should succeed (no error)
    });
});
