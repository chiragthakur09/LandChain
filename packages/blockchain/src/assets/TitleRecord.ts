import { Object, Property } from 'fabric-contract-api';

@Object()
export class OwnerShare {
    @Property()
    public ownerId: string = '';

    @Property()
    public sharePercentage: number = 100.0;
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
    public publicationDate: number = Date.now();

    @Property()
    public isConclusive: boolean = false; // Becomes true after 3 years
}
