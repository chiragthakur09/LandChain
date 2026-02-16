import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { LandParcel } from '../assets/LandParcel';
import { TitleRecord, OwnerShare } from '../assets/TitleRecord';
import { ChargeRecord } from '../assets/ChargeRecord';
import { DisputeRecord } from '../assets/DisputeRecord';
import { StrataUnit } from '../assets/StrataUnit';
import { PaymentRecord } from '../assets/PaymentRecord';
import { AssetRegistry } from '../logic/AssetRegistry';
import { LifecycleManager } from '../logic/LifecycleManager';
import { AdminValidator } from '../logic/AdminValidator';
import { FormatValidator } from '../logic/FormatValidator';

@Info({ title: 'LandChainContract', description: 'Smart Contract for LandChain: The government-grade land registry' })
export class LandChainContract extends Contract {

    @Transaction()
    public async initLedger(ctx: Context): Promise<void> {
        console.log('Initializing Ledger with Genesis Block Mock Data...');
        // Mock Genesis hash
        await this.createParcel(ctx, 'PARCEL_001', 'GOV_INDIA_TREASURY', 'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))', 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco');
    }

    @Transaction()
    @Returns('LandParcel')
    public async createParcel(ctx: Context, parcelId: string, ownerId: string, geoJson: string, docHash: string): Promise<LandParcel> {
        const exists = await this.parcelExists(ctx, parcelId);
        if (exists) {
            throw new Error(`The parcel ${parcelId} already exists`);
        }

        // Phase 29: Validate Inputs
        if (docHash.startsWith('Qm')) {
            FormatValidator.validateIPFS(docHash);
        }

        const parcel = new LandParcel();
        parcel.parcelId = parcelId;
        parcel.surveyNo = parcelId.split('_')[1] || '000';
        parcel.subDivision = '0';
        parcel.landUseType = 'AGRICULTURAL';
        parcel.area = 1.0; // Assume Hectare input for base
        parcel.geoJson = geoJson;
        parcel.docHash = docHash;
        parcel.status = 'FREE';

        // Defaults
        parcel.landCategory = 'GENERAL';
        parcel.tenureType = 'OCCUPANCY_CLASS_1';
        parcel.isTribalProtected = false;
        parcel.isWakf = false;
        parcel.isForestCRZ = false;

        // Phase 29: Local Measurement Calculation
        parcel.localMeasurementUnit = 'GUNTHA'; // Default
        // Assuming 'parcel.area' is Hectares in Ledger
        parcel.localMeasurementValue = FormatValidator.calculateLocalUnit(parcel.area, 'GUNTHA');

        parcel.mutationRequestTimestamp = 0;
        parcel.ulpinPNIU = ''; // Optional on creation, can be updated later via simple update mechanism? 
        // Or if parcelId IS the ULPIN, we validate it.
        // For now parcelId seems to be UUID style. ULPIN is separate field. 

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
            // Phase 29: CNR Validation
            // Issuer 'details' or 'issuer' might contain CNR? 
            // Let's assume 'issuer' is Court Name, 'details' contains CNR or we pass it explicitly.
            // For this POC, let's treat 'details' as potentially holding the CNR if it matches format.
            if (details.length === 16) {
                try { FormatValidator.validateCNR(details); } catch (e) { /* ignore if just text */ }
            }

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
    public async transferParcel(ctx: Context, parcelId: string, sellerId: string, buyerId: string, sharePercentage: number, salePrice: number, paymentUtr: string): Promise<void> {
        const parcel = await this.getParcel(ctx, parcelId);

        // ... existing checks ...

        // 0. Verify Payment UTR Uniqueness
        const paymentKey = `PAY_${paymentUtr}`;
        const existingPayment = await ctx.stub.getState(paymentKey);
        if (existingPayment && existingPayment.length > 0) {
            throw new Error(`Payment UTR ${paymentUtr} already used.`);
        }

        // 1. Check RoD (Must be empty or resolved)
        const activeDisputes = parcel.disputes.filter(d => d.status === 'PENDING');
        if (activeDisputes.length > 0) {
            throw new Error(`Transfer Denied: Pending Disputes on Parcel`);
        }

        // 2. Check RoCC (Must be clear)
        const activeCharges = parcel.charges.filter(c => c.active);
        for (const charge of activeCharges) {
            if (charge.type === 'MORTGAGE' || charge.type === 'TAX_DEFAULT') {
                throw new Error(`Transfer Denied: Active Charge (${charge.type}) by ${charge.holder}`);
            }
        }

        // 3. Verify Seller Ownership & Share
        const sellerIndex = parcel.title.owners.findIndex(o => o.ownerId === sellerId);
        if (sellerIndex === -1) {
            throw new Error(`Seller ${sellerId} is not an owner of this parcel`);
        }

        const sellerRecord = parcel.title.owners[sellerIndex];
        if (sellerRecord.sharePercentage < sharePercentage) {
            throw new Error(`Seller only owns ${sellerRecord.sharePercentage}%, cannot sell ${sharePercentage}%`);
        }

        // 4. Joint Holding Check (Mock Multi-Sig)
        if (sharePercentage === 100 && parcel.title.owners.length > 1) {
            throw new Error(`Multi-Sig Required: Cannot sell 100% of a Jointly Held property. Sell your share (${sellerRecord.sharePercentage}%) instead.`);
        }

        // 5. Execute Transfer (Update Shares)

        // Deduct from Seller
        sellerRecord.sharePercentage -= sharePercentage;
        if (sellerRecord.sharePercentage === 0) {
            parcel.title.owners.splice(sellerIndex, 1); // Remove seller if 0% left
        }

        // Add to Buyer
        const buyerIndex = parcel.title.owners.findIndex(o => o.ownerId === buyerId);
        if (buyerIndex !== -1) {
            parcel.title.owners[buyerIndex].sharePercentage += sharePercentage;
        } else {
            parcel.title.owners.push({ ownerId: buyerId, sharePercentage: sharePercentage });
        }

        // 6. Reset Conclusivity (Title flow changed)
        parcel.title.publicationDate = Date.now();
        parcel.title.isConclusive = false;

        // 7. Record Payment
        const payment: PaymentRecord = {
            utr: paymentUtr,
            parcelId: parcelId,
            amount: salePrice,
            payerId: buyerId,
            payeeId: sellerId,
            timestamp: Date.now(),
            status: 'CONFIRMED',
            type: 'SALE_PRICE'
        };
        await ctx.stub.putState(`PAY_${paymentUtr}`, Buffer.from(JSON.stringify(payment)));

        await ctx.stub.putState(parcelId, Buffer.from(JSON.stringify(parcel)));
    }

    @Transaction(false)
    public async getPaymentDetails(ctx: Context, utr: string): Promise<PaymentRecord> {
        const paymentKey = `PAY_${utr}`;
        const paymentBytes = await ctx.stub.getState(paymentKey);
        if (!paymentBytes || paymentBytes.length === 0) {
            throw new Error(`Payment with UTR ${utr} not found`);
        }
        return JSON.parse(paymentBytes.toString());
    }

    @Transaction()
    public async resolveDispute(ctx: Context, parcelId: string, disputeId: string, resolution: string): Promise<void> {
        const parcel = await this.getParcel(ctx, parcelId);

        const dispute = parcel.disputes.find(d => d.disputeId === disputeId);
        if (!dispute) {
            throw new Error(`Dispute ${disputeId} not found`);
        }

        if (dispute.status !== 'PENDING') {
            throw new Error(`Dispute ${disputeId} is already ${dispute.status}`);
        }

        // 1. Resolve it
        dispute.status = 'RESOLVED';

        // 2. Check if we can unlock the parcel
        const remainingDisputes = parcel.disputes.filter(d => d.status === 'PENDING');
        const activeBlockingCharges = parcel.charges.filter(c => c.active && (c.type === 'MORTGAGE' || c.type === 'TAX_DEFAULT'));

        if (remainingDisputes.length === 0 && activeBlockingCharges.length === 0) {
            parcel.status = 'FREE';
        } else if (activeBlockingCharges.length > 0) {
            parcel.status = 'LOCKED'; // Still locked by charge
        }

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
        unit.status = 'FREE';

        // Phase 20: RERA Defaults
        unit.udsValue = 0;
        unit.reraRegistrationNumber = 'NOT_REGISTERED';
        unit.ocDocumentHash = '';
        unit.legalEntity = 'HOUSING_SOCIETY';

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
        const validUses = ['AGRICULTURAL', 'NON_AGRICULTURAL', 'INDUSTRIAL', 'FOREST', 'RESERVED'];
        if (!validUses.includes(newUse)) {
            throw new Error('Invalid Land Use Type');
        }
        return await LifecycleManager.convertLandUse(ctx, parcelId, newUse as any);
    }

    @Transaction()
    public async finalizeTitle(ctx: Context, parcelId: string): Promise<void> {
        const parcel = await this.getParcel(ctx, parcelId);

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
    // ============================================================
    // Phase 16: Dynamic State Machine (Pluggable Architecture)
    // ============================================================

    // Configuration: 30 Days in Milliseconds
    public static readonly MUTATION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

    @Transaction()
    public async executeTransaction(ctx: Context, transactionType: string, transactionDataJson: string, evidenceHash: string): Promise<void> {
        const transactionData = JSON.parse(transactionDataJson);
        const { parcelId } = transactionData;

        // Phase 27: Amalgamation handles its own fetching
        if (transactionType === 'AMALGAMATE_PARCELS') {
            await this.processAmalgamation(ctx, transactionData);
            return;
        }

        // 1. Fetch Asset (LandParcel or StrataUnit)
        const parcelBytes = await ctx.stub.getState(parcelId);
        if (!parcelBytes || parcelBytes.length === 0) {
            throw new Error(`Asset ${parcelId} not found`);
        }
        const parcel: any = JSON.parse(parcelBytes.toString());

        // 2. Global Validation (State Machine)
        if (parcel.status !== 'FREE') {
            // Allow some transactions on Locked assets? (e.g. Unlock)
            if (transactionType !== 'RESOLVE_DISPUTE' && transactionType !== 'UNLOCK_CHARGE' && transactionType !== 'APPROVE_MUTATION' && transactionType !== 'INTIMATE_DEATH') {
                // Determine if interaction is allowed based on status
                throw new Error(`Asset is ${parcel.status}. Cannot execute ${transactionType}.`);
            }
        }

        // Check Parent Land Status if this is a Strata Unit
        if ('parentParcelId' in parcel && (parcel as any).parentParcelId) {
            const parentId = (parcel as any).parentParcelId;
            const parentBytes = await ctx.stub.getState(parentId);
            if (parentBytes && parentBytes.length > 0) {
                const parentAsset = JSON.parse(parentBytes.toString());
                if (parentAsset.status && parentAsset.status !== 'FREE') {
                    throw new Error(`Operation Blocked: Parent Land (${parentId}) is NOT Free (Status: ${parentAsset.status}). Litigation/Locks extend to all units.`);
                }
            }
        }

        // Admin Validation (Tribal Check)
        await AdminValidator.validateTribalTransfer(ctx, parcel, transactionData);

        // 3. Delegate to Transaction Logic (The "Plug")
        switch (transactionType) {
            case 'SALE':
                // RERA Check (If StrataUnit)
                if (parcel.docHash === undefined) { // HACK: StrataUnit structure check
                    // It's likely a StrataUnit if it has parentParcelId, but here we are using 'any' type.
                    // Let's assume for now we check if specific fields exist.
                }
                if (parcel.unitId) { // It is a Strata Unit
                    await AdminValidator.validateRERACompliance(ctx, parcel, transactionType);
                }

                await this.processSale(ctx, parcel, transactionData);

                // Mutation Scrutiny (Simulated)
                // Instead of instant success, we might mark it pending.
                // Or better, the 'processSale' updates the owner, but status becomes PENDING.
                parcel.status = 'PENDING_SCRUTINY';
                parcel.mutationRequestTimestamp = Date.now(); // Start 30-day Timer
                break;
            case 'PARTITION':
                await this.processPartition(ctx, parcel, transactionData);
                break;
            case 'INHERITANCE':
                await this.processInheritance(ctx, parcel, transactionData);
                break;
            case 'CONVERSION':
                await this.processConversion(ctx, parcel, transactionData);
                break;
            case 'APPROVE_MUTATION':
                // End Scrutiny with Timer Check
                if (parcel.status === 'PENDING_SCRUTINY') {
                    const minPeriod = LandChainContract.MUTATION_PERIOD_MS;
                    const timeElapsed = Date.now() - parcel.mutationRequestTimestamp;

                    if (timeElapsed < minPeriod) {
                        // For Demo purposes, we might want to bypass this or have a FORCE flag?
                        // Let's enforce it strictly as per "Code Surgery" request.
                        const remainingDays = Math.ceil((minPeriod - timeElapsed) / (24 * 60 * 60 * 1000));
                        throw new Error(`Scrutiny Period Active. Cannot approve mutation yet. Try again in ${remainingDays} days.`);
                    }

                    parcel.status = 'FREE';
                    parcel.mutationRequestTimestamp = 0; // Reset
                } else {
                    throw new Error('Asset is not pending scrutiny.');
                }
                break;
            // Indian Lifecycle Workflows
            case 'REGISTER_ATS':
                await this.processAgreementToSale(ctx, parcel, transactionData);
                break;
            case 'INTIMATE_DEATH':
                await this.processDeathIntimation(ctx, parcel, transactionData);
                break;
            case 'GIFT':
                await this.processGift(ctx, parcel, transactionData);
                break;
            case 'FINALIZE_PARTITION':
                await this.finalizePartitionRetirement(ctx, parcel, transactionData);
                break;
            // Phase 27: Urban
            case 'AMALGAMATE_PARCELS':
                // This is a multi-asset transaction, validation is internal.
                // We pass 'parcel' as context but logic handles list.
                await this.processAmalgamation(ctx, transactionData);
                break;
            case 'RECTIFY_BOUNDARY':
                await this.processBoundaryRectification(ctx, parcel, transactionData);
                break;
            case 'UNLOCK_CHARGE':
                await this.processUnlockCharge(ctx, parcel, transactionData);
                break;
            default:
                throw new Error(`Unknown Transaction Type: ${transactionType}`);
        }

        // 4. Update State (Partition handles its own puts)
        if (transactionType !== 'PARTITION') {
            await ctx.stub.putState(parcelId, Buffer.from(JSON.stringify(parcel)));
        }

        // 5. Emit Event
        ctx.stub.setEvent('TransactionExecuted', Buffer.from(JSON.stringify({ type: transactionType, parcelId, timestamp: Date.now() })));
    }

    private async processSale(ctx: Context, parcel: LandParcel, data: any) {
        // data: { sellerId, buyerId, price, share }
        parcel.title.owners = [{ ownerId: data.buyerId, sharePercentage: 100 }];
        parcel.title.isConclusive = false;
        parcel.title.publicationDate = Date.now();
    }

    private async processPartition(ctx: Context, parentParcel: LandParcel, data: any) {
        // data: { subParcels: [{ id, area, owner, surveySuffix }] }
        parentParcel.status = 'RETIRED';
        await ctx.stub.putState(parentParcel.parcelId, Buffer.from(JSON.stringify(parentParcel)));

        for (const child of data.subParcels) {
            const newParcel = new LandParcel();
            Object.assign(newParcel, parentParcel);
            newParcel.parcelId = child.id;
            newParcel.subDivision = parentParcel.subDivision + '/' + child.surveySuffix;
            newParcel.area = child.area;
            newParcel.status = 'FREE';
            newParcel.title = { ...parentParcel.title, owners: [{ ownerId: child.owner, sharePercentage: 100 }], isConclusive: false, publicationDate: Date.now() };

            await ctx.stub.putState(newParcel.parcelId, Buffer.from(JSON.stringify(newParcel)));
        }
    }

    private async processInheritance(ctx: Context, parcel: LandParcel, data: any) {
        // data: { heirs: [{ id, share }] }
        parcel.title.owners = data.heirs.map((h: any) => ({ ownerId: h.id, sharePercentage: h.share }));
        parcel.title.isConclusive = false;
        parcel.title.publicationDate = Date.now();
    }

    private async processConversion(ctx: Context, parcel: LandParcel, data: any) {
        // 1. Check if allowed
        if (parcel.landUseType === 'FOREST' || parcel.isForestCRZ) {
            throw new Error(`Restricted: Cannot convert FOREST or CRZ land. Protected under Forest Conservation Act.`);
        }
        // data: { newUse: string }
        parcel.landUseType = data.newUse;
    }

    // =========================================================
    // Comprehensive Lifecycle Workflows (Indian Context)
    // =========================================================

    private async processAgreementToSale(ctx: Context, parcel: LandParcel, data: any) {
        // data: { buyerId, agreementDate, advanceAmount }
        parcel.status = 'PENDING_ATS';
        // ideally we would add a charge here too, but status change is sufficient for locking
    }

    private async processDeathIntimation(ctx: Context, parcel: LandParcel, data: any) {
        // data: { deceasedOwnerId, deathCertificateHash, dateOfDeath }
        parcel.status = 'LOCKED_FOR_SUCCESSION';
        // logic to verify deceasedOwnerId exists in owners list could be added
    }

    private async processGift(ctx: Context, parcel: LandParcel, data: any) {
        // Gift is effectively a Transfer but with 0 consideration usually.
        // We might simply check stamp duty if we were calculating it.
        // For now, it aliases to standard transfer logic but we can add specific checks.
        // data: { doneeId, giftDeedHash }
        parcel.status = 'PENDING_SCRUTINY'; // triggers standard mutation flow
        parcel.mutationRequestTimestamp = Date.now();
        parcel.title.owners = [{ ownerId: data.doneeId, sharePercentage: 100 }];
        parcel.title.isConclusive = false;
    }

    private async finalizePartitionRetirement(ctx: Context, parcel: LandParcel, data: any) {
        // data: { newParcels: [...] } 
        // This is called AFTER creating new parcels usually.
        // Here we just mark parent as RETIRED.
        parcel.status = 'RETIRED';
    }

    // =========================================================
    // Phase 27: Urban & Commercial Workflows
    // =========================================================

    private async processAmalgamation(ctx: Context, data: any) {
        // data: { constituentParcelIds: string[], newParcelId: string, newGeoJson: string }
        const { constituentParcelIds, newParcelId, newGeoJson } = data;

        if (!constituentParcelIds || constituentParcelIds.length < 2) {
            throw new Error('Amalgamation requires at least two parcels.');
        }

        const sourceParcels: LandParcel[] = [];
        let primaryOwner = '';

        // 1. Validate Source Parcels
        for (const pid of constituentParcelIds) {
            const parcelBytes = await ctx.stub.getState(pid);
            if (!parcelBytes || parcelBytes.length === 0) throw new Error(`Parcel ${pid} not found`);
            const p: LandParcel = JSON.parse(parcelBytes.toString());

            if (p.status !== 'FREE') throw new Error(`Parcel ${pid} is not FREE.`);

            // ownership check (simplistic: first owner must match)
            const currentOwner = p.title.owners[0].ownerId;
            if (!primaryOwner) primaryOwner = currentOwner;
            if (primaryOwner !== currentOwner) throw new Error(`Ownership mismatch. All parcels must belong to ${primaryOwner}.`);

            sourceParcels.push(p);
        }

        // 2. Retire Source Parcels
        for (const p of sourceParcels) {
            p.status = 'RETIRED';
            await ctx.stub.putState(p.parcelId, Buffer.from(JSON.stringify(p)));
        }

        // 3. Create Merged Parcel
        const mergedParcel = new LandParcel();
        mergedParcel.parcelId = newParcelId;
        mergedParcel.status = 'FREE';
        mergedParcel.title = new TitleRecord();
        mergedParcel.title.parcelId = newParcelId;
        mergedParcel.title.owners = [{ ownerId: primaryOwner, sharePercentage: 100 }];
        mergedParcel.title.isConclusive = false; // New Survey needed
        mergedParcel.geoJson = newGeoJson;
        mergedParcel.area = sourceParcels.reduce((sum, p) => sum + p.area, 0); // Sum areas
        mergedParcel.landUseType = sourceParcels[0].landUseType; // Inherit from first
        mergedParcel.ulpinPNIU = ''; // Pending new assignment

        await ctx.stub.putState(newParcelId, Buffer.from(JSON.stringify(mergedParcel)));
    }

    private async processBoundaryRectification(ctx: Context, parcel: LandParcel, data: any) {
        // data: { newGeoJson, surveyRef, newUlpin }
        if (!data.newGeoJson) throw new Error('New GeoJSON is required for rectification.');

        parcel.geoJson = data.newGeoJson;

        // Phase 29: Valid ULPIN Update
        if (data.newUlpin) {
            FormatValidator.validateULPIN(data.newUlpin);
            parcel.ulpinPNIU = data.newUlpin;
        }

        // In a real system, we would log the surveyRef to a history or immutable trail.
        // potentially ctx.stub.putState(`SURVEY_${data.surveyRef}`, ...)
    }

    private async processUnlockCharge(ctx: Context, parcel: LandParcel, data: any) {
        // data: { chargeId }
        const charge = parcel.charges.find(c => c.chargeId === data.chargeId);
        if (!charge) throw new Error(`Charge ${data.chargeId} not found.`);
        if (!charge.active) throw new Error(`Charge ${data.chargeId} is already inactive.`);

        // In real system, check ctx.clientIdentity matched charge.holder

        charge.active = false;

        // Check if we can unlock the parcel
        const remainingActiveCharges = parcel.charges.filter(c => c.active && (c.type === 'MORTGAGE' || c.type === 'TAX_DEFAULT'));
        const pendingDisputes = parcel.disputes.filter(d => d.status === 'PENDING');

        if (remainingActiveCharges.length === 0 && pendingDisputes.length === 0) {
            parcel.status = 'FREE';
        }
    }
}
