import { Object, Property } from 'fabric-contract-api';
import { TitleRecord } from './TitleRecord';
import { DisputeRecord } from './DisputeRecord';
import { ChargeRecord } from './ChargeRecord';

@Object()
export class StrataUnit {
    @Property()
    public unitId: string = ''; // e.g. "APT_101"

    @Property()
    public parentParcelId: string = ''; // Link to main LandParcel

    @Property()
    public carpetArea: number = 0; // Sq Ft / Sq Mtrs

    @Property()
    public floor: number = 0;

    @Property()
    public udsPercent: number = 0; // Undivided Share of Land

    @Property()
    public title: TitleRecord = new TitleRecord();

    @Property()
    public disputes: DisputeRecord[] = [];

    @Property()
    public charges: ChargeRecord[] = [];
}
