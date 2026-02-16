import { Context } from 'fabric-contract-api';
import { LandParcel } from '../assets/LandParcel';

export class LifecycleManager {

    public static async convertLandUse(ctx: Context, ulpin: string, newUse: 'AGRICULTURAL' | 'NON_AGRICULTURAL' | 'INDUSTRIAL' | 'FOREST' | 'RESERVED'): Promise<LandParcel> {
        // 1. Retrieve Parcel
        const parcelBytes = await ctx.stub.getState(ulpin);
        if (!parcelBytes || parcelBytes.length === 0) {
            throw new Error(`Parcel ${ulpin} not found`);
        }
        const parcel: LandParcel = JSON.parse(parcelBytes.toString());

        // 2. Validate Authority (Mock for POC)
        // const clientId = ctx.clientIdentity.getID();
        // if (!clientId.includes('REVENUE_Authority')) throw new Error('Only Revenue Authority can convert land use');

        // 3. Update Usage
        const oldUse = parcel.landUseType;
        parcel.landUseType = newUse;

        // 4. Save State
        await ctx.stub.putState(ulpin, Buffer.from(JSON.stringify(parcel)));

        // 5. Emit Event
        ctx.stub.setEvent('ConversionEvent', Buffer.from(JSON.stringify({ ulpin, oldUse, newUse })));

        return parcel;
    }
}
