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
    public status: 'FREE' | 'LOCKED' | 'LITIGATION' | 'RETIRED' = 'FREE';

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
