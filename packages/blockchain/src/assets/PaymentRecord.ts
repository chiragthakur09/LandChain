import { Object, Property } from 'fabric-contract-api';

@Object()
export class PaymentRecord {
    @Property()
    public utr!: string;

    @Property()
    public parcelId!: string;

    @Property()
    public amount!: number;

    @Property()
    public payerId!: string;

    @Property()
    public payeeId!: string;

    @Property()
    public timestamp!: number;

    @Property()
    public status!: 'CONFIRMED' | 'FAILED';

    @Property()
    public type!: 'SALE_PRICE' | 'STAMP_DUTY';
}
