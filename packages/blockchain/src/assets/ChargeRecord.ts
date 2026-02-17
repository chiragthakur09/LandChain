import { Object, Property } from 'fabric-contract-api';

@Object()
export class ChargeRecord {
    @Property()
    public chargeId: string = '';

    @Property()
    public ulpin: string = ''; // Foreign Key
    @Property()
    public type: 'MORTGAGE' | 'LEASE' | 'EASEMENT' | 'TAX_DEFAULT' | 'GOVERNMENT_CHARGE' = 'MORTGAGE';

    @Property()
    public holder: string = ''; // Bank, Municipality, or Beneficiary

    @Property()
    public amount: number = 0;

    @Property()
    public active: boolean = true;

    @Property()
    public timestamp: number = Date.now();
}
