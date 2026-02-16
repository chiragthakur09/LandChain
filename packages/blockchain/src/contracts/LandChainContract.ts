import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { LandParcel } from '../assets/LandParcel';
import { TitleRecord, OwnerShare } from '../assets/TitleRecord';
import { ChargeRecord } from '../assets/ChargeRecord';
import { DisputeRecord } from '../assets/DisputeRecord';
import { StrataUnit } from '../assets/StrataUnit'; // Import StrataUnit
import { AssetRegistry } from '../logic/AssetRegistry';
import { LifecycleManager } from '../logic/LifecycleManager';
// import { EncumbranceLogic } from '../logic/EncumbranceLogic'; // Needs refactor affecting import

@Info({ title: 'LandChainContract', description: 'Smart Contract for LandChain: The government-grade land registry' })
export class LandChainContract extends Contract {

    @Transaction()
    public async initLedger(ctx: Context): Promise<void> {
        console.log('Initializing Ledger with Genesis Block Mock Data...');
        await this.createParcel(ctx, 'PARCEL_001', 'GOV_INDIA_TREASURY', 'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))', 'QmHashGenesis');
    }

    @Transaction()
    @Returns('LandParcel')
    public async createParcel(ctx: Context, parcelId: string, ownerId: string, geoJson: string, docHash: string): Promise<LandParcel> {
        const exists = await this.parcelExists(ctx, parcelId);
        if (exists) {
            throw new Error(`The parcel ${parcelId} already exists`);
        }

        const parcel = new LandParcel();
        parcel.parcelId = parcelId;
        parcel.surveyNo = parcelId.split('_')[1] || '000';
        parcel.subDivision = '0';
        parcel.landUseType = 'AGRICULTURAL';
        parcel.area = 10.0;
        parcel.geoJson = geoJson;
        parcel.docHash = docHash;
        parcel.status = 'FREE';

        // Initialize RoT (Title Record)
        parcel.title = new TitleRecord();
        parcel.title.titleId = `TITLE_${parcelId}`;
        parcel.title.parcelId = parcelId;
        parcel.title.owners = [{ ownerId: ownerId, sharePercentage: 100 }];
        parcel.title.isConclusive = false;

        // Initialize Registers
        parcel.disputes = []; // RoD
        parcel.charges = []; // RoCC

        await ctx.stub.putState(parcelId, Buffer.from(JSON.stringify(parcel)));
        return parcel;
    }

    @Transaction()
    @Returns('LandParcel')
    public async getParcel(ctx: Context, parcelId: string): Promise<LandParcel> {
        const parcelJSON = await ctx.stub.getState(parcelId);
        if (!parcelJSON || parcelJSON.length === 0) {
            throw new Error(`The parcel ${parcelId} does not exist`);
        }
        return JSON.parse(parcelJSON.toString());
    }

    @Transaction()
    public async recordIntimation(ctx: Context, parcelId: string, category: 'DISPUTE' | 'CHARGE', type: string, issuer: string, details: string): Promise<void> {
        const parcel = await this.getParcel(ctx, parcelId);

        if (category === 'CHARGE') {
            const charge = new ChargeRecord();
            charge.chargeId = `CHG_${parcel.charges.length + 1}`;
            charge.parcelId = parcelId;
            charge.type = type as any; // MORTGAGE, LEASE, etc.
            charge.holder = issuer;
            charge.amount = 0; // Default or pass in arg
            charge.active = true;
            parcel.charges.push(charge);

            // Logic: Mortgage locks the land
            if (type === 'MORTGAGE' || type === 'TAX_DEFAULT') {
                parcel.status = 'LOCKED';
            }
        } else if (category === 'DISPUTE') {
            const dispute = new DisputeRecord();
            dispute.disputeId = `DSP_${parcel.disputes.length + 1}`;
            dispute.parcelId = parcelId;
            dispute.courtId = issuer;
            dispute.type = type as any;
            dispute.status = 'PENDING';
            parcel.disputes.push(dispute);

            // Logic: Dispute puts land in Litigation
            parcel.status = 'LITIGATION';
        }

        await ctx.stub.putState(parcelId, Buffer.from(JSON.stringify(parcel)));
    }

    @Transaction()
    public async transferParcel(ctx: Context, parcelId: string, newOwnerId: string, salePrice: number): Promise<void> {
        const parcel = await this.getParcel(ctx, parcelId);

        // 1. Check RoT
        // In real world, we check msg.sender against parcel.title.owners

        // 2. Check RoD (Must be empty or resolved)
        const activeDisputes = parcel.disputes.filter(d => d.status === 'PENDING');
        if (activeDisputes.length > 0) {
            throw new Error(`Transfer Denied: Pending Disputes on Parcel`);
        }

        // 3. Check RoCC (Must be clear)
        const activeCharges = parcel.charges.filter(c => c.active);
        for (const charge of activeCharges) {
            if (charge.type === 'MORTGAGE' || charge.type === 'TAX_DEFAULT') {
                throw new Error(`Transfer Denied: Active Charge (${charge.type}) by ${charge.holder}`);
            }
        }

        // 4. Update RoT
        parcel.title.owners = [{ ownerId: newOwnerId, sharePercentage: 100 }];
        // Reset Conclusivity clock? (Model Act says 3 years from notification, strict interpretation might mean 3 years from ANY title change)
        parcel.title.publicationDate = Date.now();
        parcel.title.isConclusive = false;

        // 5. Update Status
        // parcel.status remains FREE if checks pass

        await ctx.stub.putState(parcelId, Buffer.from(JSON.stringify(parcel)));
    }

    // --- Strata Titling (Vertical Units) ---

    @Transaction()
    public async createStrataUnit(ctx: Context, unitId: string, parentParcelId: string, floor: number, carpetArea: number, ownerId: string): Promise<StrataUnit> {
        // 1. Check Parent
        const parent = await this.getParcel(ctx, parentParcelId);
        if (parent.status !== 'FREE') {
            throw new Error(`Parent Parcel must be FREE to create Strata Units`);
        }

        // 2. Create Unit
        const unit = new StrataUnit();
        unit.unitId = unitId;
        unit.parentParcelId = parentParcelId;
        unit.floor = floor;
        unit.carpetArea = carpetArea;
        unit.udsPercent = 1.0; // Mock

        // 3. Init RoT for Unit
        unit.title = new TitleRecord();
        unit.title.titleId = `TITLE_${unitId}`;
        unit.title.owners = [{ ownerId: ownerId, sharePercentage: 100 }];

        unit.disputes = [];
        unit.charges = [];

        await ctx.stub.putState(unitId, Buffer.from(JSON.stringify(unit)));
        return unit;
    }

    @Transaction()
    @Returns('StrataUnit')
    public async getStrataUnit(ctx: Context, unitId: string): Promise<StrataUnit> {
        const unitJSON = await ctx.stub.getState(unitId);
        if (!unitJSON || unitJSON.length === 0) {
            throw new Error(`Strata Unit ${unitId} does not exist`);
        }
        return JSON.parse(unitJSON.toString());
    }

    // --- Advanced Lifecycle Methods (Subdivision / Conversion) ---

    @Transaction()
    public async subdivideParcel(ctx: Context, parentParcelId: string, childrenJson: string): Promise<LandParcel[]> {
        const childrenData = JSON.parse(childrenJson);
        return await AssetRegistry.subdivideParcel(ctx, parentParcelId, childrenData);
    }

    @Transaction()
    public async convertLandUse(ctx: Context, parcelId: string, newUse: string): Promise<LandParcel> {
        if (!['AGRICULTURAL', 'NON_AGRICULTURAL', 'RESIDENTIAL', 'COMMERCIAL'].includes(newUse)) {
            throw new Error('Invalid Land Use Type');
        }
        return await LifecycleManager.convertLandUse(ctx, parcelId, newUse as any);
    }

    @Transaction()
    public async finalizeTitle(ctx: Context, parcelId: string): Promise<void> {
        const parcel = await this.getParcel(ctx, parcelId);

        // 1. Check Publication Date (3 Years Logic - Mocked to 3 minutes for POC)
        // const ONE_MINUTE = 60 * 1000;
        // if (Date.now() < parcel.title.publicationDate + (3 * ONE_MINUTE)) { 
        // throw new Error('Title is still in Provisional State'); 
        // }

        // 2. Check RoD (Must be empty)
        if (parcel.disputes.some(d => d.status === 'PENDING')) {
            throw new Error('Cannot finalize title with pending disputes');
        }

        // 3. Update Conclusivity
        parcel.title.isConclusive = true;

        // 4. Emit Indemnity Event
        ctx.stub.setEvent('TitleFinalized', Buffer.from(JSON.stringify({ parcelId, titleId: parcel.title.titleId })));

        await ctx.stub.putState(parcelId, Buffer.from(JSON.stringify(parcel)));
    }

    @Transaction(false)
    public async parcelExists(ctx: Context, parcelId: string): Promise<boolean> {
        const parcelJSON = await ctx.stub.getState(parcelId);
        return parcelJSON && parcelJSON.length > 0;
    }
}
