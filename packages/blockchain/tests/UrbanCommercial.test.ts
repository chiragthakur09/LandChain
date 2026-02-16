
import * as sin from 'sinon';
import * as chai from 'chai';
import { Context } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { LandChainContract } from '../src/contracts/LandChainContract';
import { LandParcel } from '../src/assets/LandParcel';
import { TitleRecord } from '../src/assets/TitleRecord';

const sinonChai = require('sinon-chai');
chai.use(sinonChai.default || sinonChai);
const expect = chai.expect;
const sinon = require('sinon');

describe('Urban & Commercial Workflows (Amalgamation)', () => {
    let contract: LandChainContract;
    let ctx: Context;
    let mockStub: any;

    beforeEach(() => {
        contract = new LandChainContract();
        ctx = new Context();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = mockStub;
    });

    const createMockParcel = (id: string, owner: string, status: 'FREE' | 'LOCKED' = 'FREE', area: number = 10): LandParcel => {
        return {
            ulpin: id,
            surveyNo: '100',
            subDivision: '0',
            landUseType: 'NON_AGRICULTURAL',
            area: area,
            geoJson: 'POLYGON(...)',
            status: status,
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

    it('should successfully amalgamate two parcels', async () => {
        const p1 = createMockParcel('P1', 'DEV_1', 'FREE', 10);
        const p2 = createMockParcel('P2', 'DEV_1', 'FREE', 15);

        mockStub.getState.withArgs('P1').resolves(Buffer.from(JSON.stringify(p1)));
        mockStub.getState.withArgs('P2').resolves(Buffer.from(JSON.stringify(p2)));

        const txData = {
            constituentUlpins: ['P1', 'P2'],
            newUlpin: 'P_MERGED',
            newGeoJson: 'MERGED_POLY'
        };

        await contract.executeTransaction(ctx, 'AMALGAMATE_PARCELS', JSON.stringify(txData), '');

        // Check Retirements
        const p1Put = mockStub.putState.withArgs('P1').firstCall;
        expect(JSON.parse(p1Put.args[1].toString()).status).to.equal('RETIRED');

        const p2Put = mockStub.putState.withArgs('P2').firstCall;
        expect(JSON.parse(p2Put.args[1].toString()).status).to.equal('RETIRED');

        // Check Creation
        const mergePut = mockStub.putState.withArgs('P_MERGED').firstCall;
        const merged = JSON.parse(mergePut.args[1].toString());

        expect(merged.status).to.equal('FREE');
        expect(merged.area).to.equal(25);
        expect(merged.title.owners[0].ownerId).to.equal('DEV_1');
    });

    it('should fail amalgamation if owners mismatch', async () => {
        const p1 = createMockParcel('P1', 'DEV_1');
        const p2 = createMockParcel('P2', 'OTHER_GUY');

        mockStub.getState.withArgs('P1').resolves(Buffer.from(JSON.stringify(p1)));
        mockStub.getState.withArgs('P2').resolves(Buffer.from(JSON.stringify(p2)));

        const txData = { constituentUlpins: ['P1', 'P2'], newUlpin: 'P_X', newGeoJson: '' };

        try {
            await contract.executeTransaction(ctx, 'AMALGAMATE_PARCELS', JSON.stringify(txData), '');
            expect.fail();
        } catch (err: any) {
            expect(err.message).to.include('Ownership mismatch');
        }
    });

    it('should fail if a constituent parcel is LOCKED', async () => {
        const p1 = createMockParcel('P1', 'DEV_1');
        const p2 = createMockParcel('P2', 'DEV_1', 'LOCKED');

        mockStub.getState.withArgs('P1').resolves(Buffer.from(JSON.stringify(p1)));
        mockStub.getState.withArgs('P2').resolves(Buffer.from(JSON.stringify(p2)));

        const txData = { constituentUlpins: ['P1', 'P2'], newUlpin: 'P_X', newGeoJson: '' };

        try {
            await contract.executeTransaction(ctx, 'AMALGAMATE_PARCELS', JSON.stringify(txData), '');
            expect.fail();
        } catch (err: any) {
            expect(err.message).to.include('not FREE');
        }
    });

    it('should rectify boundary (Akarband correction)', async () => {
        const p1 = createMockParcel('P1', 'DEV_1');
        mockStub.getState.withArgs('P1').resolves(Buffer.from(JSON.stringify(p1)));

        const txData = { ulpin: 'P1', newGeoJson: 'CORRECTED_POLY', surveyRef: 'SUR_123' };

        await contract.executeTransaction(ctx, 'RECTIFY_BOUNDARY', JSON.stringify(txData), '');

        const p1Put = mockStub.putState.withArgs('P1').firstCall;
        const updated = JSON.parse(p1Put.args[1].toString());
        expect(updated.geoJson).to.equal('CORRECTED_POLY');
    });
});
