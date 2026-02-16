import { Object, Property } from 'fabric-contract-api';
import { Encumbrance } from './Encumbrance'; // Keep for backwards compatibility or migration? Prefer replacing.
import { TitleRecord } from './TitleRecord';
import { DisputeRecord } from './DisputeRecord';
import { ChargeRecord } from './ChargeRecord';

@Object()
export class LandParcel {
    @Property()
    public parcelId: string = ''; // Internal UUID

    @Property()
    public surveyNo: string = ''; // e.g., "102"

    @Property()
    public subDivision: string = ''; // e.g., "1", "2/A"

    @Property()
    public landUseType: 'AGRICULTURAL' | 'NON_AGRICULTURAL' | 'INDUSTRIAL' | 'FOREST' | 'RESERVED' = 'AGRICULTURAL';

    @Property()
    public area: number = 0; // in Acres/Gunthas

    @Property()
    public geoJson: string = ''; // 2D Polygon coordinates

    @Property()
    public status: 'FREE' | 'LOCKED' | 'LITIGATION' | 'RETIRED' | 'PENDING_SCRUTINY' = 'FREE';

    // Phase 20: India Specific Classifications
    @Property()
    public landCategory: 'NAZUL' | 'GAIR_MAZARUA_AAM' | 'TRIBAL_SCHEDULED' | 'GENERAL' = 'GENERAL';

    @Property()
    public tenureType: 'OCCUPANCY_CLASS_1' | 'OCCUPANCY_CLASS_2' | 'LEASEHOLD' = 'OCCUPANCY_CLASS_1';

    // Phase 26: Advanced Schema
    @Property()
    public ulpinPNIU: string = ''; // 14-digit Bhu-Aadhar based on coordinates

    @Property()
    public isTribalProtected: boolean = false; // CNT/SPT Act

    @Property()
    public isWakf: boolean = false; // Wakf Board

    @Property()
    public isForestCRZ: boolean = false; // Conservation Zone

    // Localized Measurement (for UI/RTC display)
    @Property()
    public localMeasurementUnit: 'BIGHA' | 'GUNTHA' | 'KANAL' | 'CENT' = 'GUNTHA';

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
}
