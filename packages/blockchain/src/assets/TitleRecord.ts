import { Object, Property } from 'fabric-contract-api';

@Object()
export class OwnerShare {
    @Property()
    public ownerId: string = '';
    @Property()
    public sharePercentage: number = 0;
}

@Object()
export class TransactionDetails {
    @Property()
    public transactionType: string = '';
    @Property()
    public timestamp: number = 0;
    @Property()
    public considerationAmount: number = 0;
    @Property()
    public stampDutyAmount: number = 0;
    @Property()
    public stampDutyChallan: string = '';
    @Property()
    public witnesses: string[] = [];
}

@Object()
export class TitleRecord {
    @Property()
    public titleId: string = '';
    @Property()
    public parcelId: string = '';
    @Property()
    public owners: OwnerShare[] = [];
    @Property()
    public isConclusive: boolean = false;
    @Property()
    public publicationDate: number = 0;

    // Phase 34: Provenance
    @Property()
    public lastTransaction?: TransactionDetails;
}
