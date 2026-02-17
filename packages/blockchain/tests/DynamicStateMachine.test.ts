import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { LandParcel } from '../src/assets/LandParcel';
import { expect } from 'chai';
import * as sinon from 'sinon';

describe('Dynamic State Machine (Schema 2.0)', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: sinon.SinonStubbedInstance<ChaincodeStub>;
    let mockClientIdentity: sinon.SinonStubbedInstance<ClientIdentity>;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        mockClientIdentity = sinon.createStubInstance(ClientIdentity);
        ctx.stub = mockStub;
        ctx.clientIdentity = mockClientIdentity;
    });

    const createMockParcel = (id: string, status: 'FREE' | 'LOCKED' | 'LITIGATION' | 'RETIRED' = 'FREE'): LandParcel => {
        return {
            ulpin: id,
            surveyNo: '100',
            subDivision: '0',
            landUseType: 'AGRICULTURAL',
            area: 10,
            geoJson: 'POLYGON(...)',
            status: status,
            title: {
                titleId: `TITLE_${id}`,
                ulpin: id,
                owners: [{ ownerId: 'OWNER_A', sharePercentage: 100 }],
                isConclusive: true,
                publicationDate: Date.now()
            },
            disputes: [],
            charges: [],
            docHash: 'HASH'
        };
    };

    it('should execute SALE transaction correctly', async () => {
        const parcel = createMockParcel('PARCEL_100');
        mockStub.getState.withArgs('PARCEL_100').resolves(Buffer.from(JSON.stringify(parcel)));

        const txData = {
            ulpin: 'PARCEL_100',
            sellerId: 'OWNER_A',
            buyerId: 'OWNER_B',
            price: 5000000,
            share: 100
        };

        await contract.executeTransaction(ctx, 'SALE', JSON.stringify(txData), 'EVIDENCE_HASH');

        expect(mockStub.putState.calledTwice).to.be.false; // Wait, putState valid?
        const putCall = mockStub.putState.getCall(0);
        expect(putCall).to.exist;
        const updatedParcel = JSON.parse(putCall.args[1].toString()) as LandParcel;

        expect(updatedParcel.title.owners[0].ownerId).to.equal('OWNER_B');
        expect(updatedParcel.title.isConclusive).to.be.false;
        expect(mockStub.setEvent.calledWith('TransactionExecuted')).to.be.true;
    });

    it('should execute INHERITANCE transaction correctly', async () => {
        const parcel = createMockParcel('PARCEL_100');
        mockStub.getState.withArgs('PARCEL_100').resolves(Buffer.from(JSON.stringify(parcel)));

        const txData = {
            ulpin: 'PARCEL_100',
            heirs: [
                { id: 'HEIR_1', share: 50 },
                { id: 'HEIR_2', share: 50 }
            ]
        };

        await contract.executeTransaction(ctx, 'INHERITANCE', JSON.stringify(txData), 'DEATH_CERT_HASH');

        const putCall = mockStub.putState.getCall(0);
        const updatedParcel = JSON.parse(putCall.args[1].toString()) as LandParcel;

        expect(updatedParcel.title.owners.length).to.equal(2);
        expect(updatedParcel.title.owners[0].ownerId).to.equal('HEIR_1');
        expect(updatedParcel.title.owners[0].sharePercentage).to.equal(50);
        expect(updatedParcel.title.isConclusive).to.be.false;
    });

    it('should execute PARTITION transaction correctly', async () => {
        const parcel = createMockParcel('MH12PAR0000100');
        mockStub.getState.withArgs('MH12PAR0000100').resolves(Buffer.from(JSON.stringify(parcel)));

        const txData = {
            ulpin: 'MH12PAR0000100',
            subParcels: [
                { id: 'MH12PAR0000101', area: 5, owner: 'OWNER_A', surveySuffix: '1' },
                { id: 'MH12PAR0000102', area: 5, owner: 'OWNER_A', surveySuffix: '2' }
            ]
        };

        await contract.executeTransaction(ctx, 'PARTITION', JSON.stringify(txData), 'MAP_HASH');

        // Should retire parent
        const parentPut = mockStub.putState.withArgs('MH12PAR0000100').firstCall;
        const retiredParent = JSON.parse(parentPut.args[1].toString()) as LandParcel;
        expect(retiredParent.status).to.equal('RETIRED');

        // Should create 2 children
        const child1Put = mockStub.putState.withArgs('MH12PAR0000101').firstCall;
        const child1 = JSON.parse(child1Put.args[1].toString()) as LandParcel;
        expect(child1.subDivision).to.equal('0/1');
        expect(child1.area).to.equal(5);
        expect(child1.status).to.equal('FREE');

        const child2Put = mockStub.putState.withArgs('MH12PAR0000102').firstCall;
        expect(child2Put).to.exist;
    });

    it('should execute CONVERSION transaction correctly', async () => {
        const parcel = createMockParcel('MH12PAR0000100');
        mockStub.getState.withArgs('MH12PAR0000100').resolves(Buffer.from(JSON.stringify(parcel)));

        const txData = {
            ulpin: 'MH12PAR0000100',
            newUse: 'NON_AGRICULTURAL'
        };

        await contract.executeTransaction(ctx, 'CONVERSION', JSON.stringify(txData), 'ORDER_HASH');

        const putCall = mockStub.putState.getCall(0);
        const updatedParcel = JSON.parse(putCall.args[1].toString()) as LandParcel;

        expect(updatedParcel.landUseType).to.equal('NON_AGRICULTURAL');
    });

    it('should block transaction if asset is LOCKED', async () => {
        const parcel = createMockParcel('MH12LCK0000001', 'LOCKED');
        mockStub.getState.withArgs('MH12LCK0000001').resolves(Buffer.from(JSON.stringify(parcel)));

        const txData = { ulpin: 'MH12LCK0000001' };

        try {
            await contract.executeTransaction(ctx, 'SALE', JSON.stringify(txData), 'HASH');
            expect.fail('Should have thrown error');
        } catch (err: any) {
            expect(err.message).to.include('Asset is LOCKED');
        }
    });

    it('should block unknown transaction type', async () => {
        const parcel = createMockParcel('MH12PAR0000100');
        mockStub.getState.withArgs('MH12PAR0000100').resolves(Buffer.from(JSON.stringify(parcel)));

        try {
            await contract.executeTransaction(ctx, 'UNKNOWN_TYPE', JSON.stringify({ ulpin: 'MH12PAR0000100' }), 'HASH');
            expect.fail('Should have thrown error');
        } catch (err: any) {
            expect(err.message).to.include('Unknown Transaction Type');
        }
    });
});
