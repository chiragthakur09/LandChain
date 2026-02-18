import { Object, Property } from 'fabric-contract-api';
import { TitleRecord } from './TitleRecord';
import { DisputeRecord } from './DisputeRecord';
import { ChargeRecord } from './ChargeRecord';
import { SpatialData } from './SpatialData'; // Phase 47

@Object()
export class LegacyIdentifiers {
    @Property()
    public ctsNumber?: string;

    @Property()
    public surveyNumber?: string;

    @Property()
    public plotNumber?: string;

    @Property()
    public propertyCardId?: string;
}

@Object()
export class PendingTransfer {
    @Property()
    public buyerId: string = '';

    @Property()
    public sellerId: string = '';

    @Property()
    public sharePercentage: number = 0;

    @Property()
    public consideration: number = 0;

    @Property()
    public witnesses: string[] = [];

    @Property()
    public stampDutyRef: string = '';

    @Property()
    public requestTimestamp: number = 0; // Epoch

    @Property()
    public officerApproved: boolean = false;
}

@Object()
export class LandParcel {
    @Property()
    public ulpin: string = ''; // 14-digit Bhu-Aadhar (Primary Key)

    @Property()
    public surveyNo: string = ''; // e.g., "102"

    @Property()
    public subDivision: string = ''; // e.g., "1", "2/A"

    @Property()
    public landUseType: 'AGRICULTURAL' | 'NON_AGRICULTURAL' | 'INDUSTRIAL' | 'FOREST' | 'RESERVED' = 'AGRICULTURAL';

    @Property()
    public area: number = 0; // in Acres/Gunthas

    @Property()
    public geoJson: string = ''; // 2D Polygon coordinates (Legacy / Simple UI)

    // Phase 47: Advanced Spatial Engine (Bhu-Naksha)
    @Property()
    public spatialData?: SpatialData;

    @Property()
    public status: 'FREE' | 'LOCKED' | 'LITIGATION' | 'RETIRED' | 'PENDING_SCRUTINY' | 'PENDING_ATS' | 'LOCKED_FOR_SUCCESSION' | 'PENDING_MUTATION' = 'FREE';

    // Phase 20: India Specific Classifications
    @Property()
    public landCategory: 'NAZUL' | 'GAIR_MAZARUA_AAM' | 'TRIBAL_SCHEDULED' | 'GENERAL' = 'GENERAL';

    @Property()
    public tenureType: 'OCCUPANCY_CLASS_1' | 'OCCUPANCY_CLASS_2' | 'LEASEHOLD' = 'OCCUPANCY_CLASS_1';

    // Phase 26: Advanced Schema


    @Property()
    public isTribalProtected: boolean = false; // CNT/SPT Act

    @Property()
    public isWakf: boolean = false; // Wakf Board

    @Property()
    public isForestCRZ: boolean = false; // Conservation Zone

    // Localized Measurement (for UI/RTC display)
    @Property()
    public localMeasurementUnit: 'BIGHA' | 'GUNTHA' | 'KANAL' | 'CENT' | 'HECTARE' | 'ACRE' = 'GUNTHA';

    @Property()
    public localMeasurementValue: number = 0;

    @Property()
    public mutationRequestTimestamp: number = 0; // Epoch for Mutation Start

    // @Property()
    // public ownerId: string = ''; // DEPRECATED in favor of TitleRecord

    // @Property()
    // public encumbrances: Encumbrance[] = []; // DEPRECATED in favor of ChargeRecord

    // New Composite Fields
    @Property()
    public title: TitleRecord = new TitleRecord();

    @Property()
    public disputes: DisputeRecord[] = [];

    @Property()
    public charges: ChargeRecord[] = [];

    @Property()
    public docHash: string = ''; // IPFS Hash of the Title Deed

    // Phase 43: Legacy Identifiers (Optional Bridge)
    @Property()
    public legacyIdentifiers: LegacyIdentifiers = new LegacyIdentifiers();

    // Phase 45: Administrative Engine (Transaction Decoupling)
    @Property()
    public pendingTransfer?: PendingTransfer;
}
