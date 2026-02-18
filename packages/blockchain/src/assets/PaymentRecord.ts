import { Object, Property } from 'fabric-contract-api';

@Object()
export class PaymentRecord {
    @Property()
    public utr!: string;

    @Property()
    public ulpin: string = ''; // Foreign Key

    @Property()
    public amount!: number;

    @Property()
    public payerId!: string;

    @Property()
    public payeeId!: string;

    @Property()
    public timestamp!: number;

    @Property()
    public status!: 'CONFIRMED' | 'FAILED' | 'ESCROW_LOCKED';

    @Property()
    public type!: 'SALE_PRICE' | 'STAMP_DUTY';
}
