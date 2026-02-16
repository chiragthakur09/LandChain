import { Object, Property } from 'fabric-contract-api';

@Object()
export class Encumbrance {
    @Property()
    public id: string = '';

    @Property()
    public type: 'BANK_LIEN' | 'COURT_ORDER' | 'TAX_DEFAULT' = 'BANK_LIEN';

    @Property()
    public issuer: string = ''; // Bank or Court Node ID

    @Property()
    public reason: string = '';

    @Property()
    public active: boolean = true;

    @Property()
    public timestamp: number = Date.now();
}
