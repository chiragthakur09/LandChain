import { Object, Property } from 'fabric-contract-api';
import { TitleRecord } from './TitleRecord';
import { DisputeRecord } from './DisputeRecord';
import { ChargeRecord } from './ChargeRecord';

@Object()
export class StrataUnit {
    @Property()
    public ulpin: string = ''; // 14-digit ULPIN for the Unit

    @Property()
    public parentUlpin: string = ''; // Link to Parent LandParcel

    @Property()
    public carpetArea: number = 0; // Sq Ft / Sq Mtrs

    @Property()
    public floor: number = 0;

    @Property()
    public udsPercent: number = 0; // Undivided Share of Land (%)

    @Property()
    public udsValue: number = 0; // Undivided Share in Sq Mtrs (Absolute)

    // Phase 26: Advanced Schema
    @Property()
    public udsFormula: string = ''; // Transparency on calculation

    @Property()
    public membershipProof: string = ''; // Share Cert or Deed Hash

    // --- Phase 20: RERA & Governance ---
    @Property()
    public reraRegistrationNumber: string = '';

    @Property()
    public ocDocumentHash: string = ''; // Occupancy Certificate (Mandatory for possession)

    @Property()
    public legalEntity: 'HOUSING_SOCIETY' | 'CONDOMINIUM' = 'HOUSING_SOCIETY';

    @Property()
    public status: 'FREE' | 'LOCKED' | 'LITIGATION' | 'RETIRED' | 'PENDING_SCRUTINY' = 'FREE';

    @Property()
    public title: TitleRecord = new TitleRecord();

    @Property()
    public disputes: DisputeRecord[] = [];

    @Property()
    public charges: ChargeRecord[] = [];
}
