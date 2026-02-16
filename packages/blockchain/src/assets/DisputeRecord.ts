import { Object, Property } from 'fabric-contract-api';

@Object()
export class DisputeRecord {
    @Property()
    public disputeId: string = '';

    @Property()
    public parcelId: string = '';

    @Property()
    public courtId: string = ''; // The court where suit is filed

    @Property()
    public type: 'CIVIL_SUIT' | 'STATUTORY_ATTACHMENT' = 'CIVIL_SUIT';

    @Property()
    public status: 'PENDING' | 'RESOLVED' = 'PENDING';

    @Property()
    public timestamp: number = Date.now();
}
