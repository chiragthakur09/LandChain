import { Context } from 'fabric-contract-api';
import { LandParcel } from '../assets/LandParcel';

export class AssetRegistry {

    public static async subdivideParcel(ctx: Context, parentParcelId: string, childrenData: any[]): Promise<LandParcel[]> {
        // 1. Retrieve Parent
        const parentBytes = await ctx.stub.getState(parentParcelId);
        if (!parentBytes || parentBytes.length === 0) {
            throw new Error(`Parent parcel ${parentParcelId} not found`);
        }
        const parent: LandParcel = JSON.parse(parentBytes.toString());

        // 2. Validate Parent Status
        if (parent.status !== 'FREE') {
            throw new Error(`Parent parcel must be FREE to subdivide. Current status: ${parent.status}`);
        }

        // 3. Validate Area Sum
        const totalChildArea = childrenData.reduce((sum, child) => sum + child.area, 0);
        // Allow small floating point error margin or exact match. For POC, exact match.
        if (Math.abs(totalChildArea - parent.area) > 0.01) {
            throw new Error(`Sum of child areas (${totalChildArea}) must equal parent area (${parent.area})`);
        }

        // 4. Retire Parent
        parent.status = 'RETIRED';
        await ctx.stub.putState(parentParcelId, Buffer.from(JSON.stringify(parent)));

        // 5. Mint Children
        const createdChildren: LandParcel[] = [];
        for (const childData of childrenData) {
            const child = new LandParcel();
            child.parcelId = childData.parcelId;
            child.surveyNo = parent.surveyNo;
            child.subDivision = childData.subDivision; // e.g. "1", "2"
            child.landUseType = parent.landUseType; // Inherit land use
            child.area = childData.area;
            child.geoJson = childData.geoJson;
            child.status = 'FREE';
            child.docHash = parent.docHash; // Inherit root deed for now

            // Link new RoT
            child.title = JSON.parse(JSON.stringify(parent.title)); // Deep copy title
            child.title.parcelId = child.parcelId;
            child.title.titleId = `TITLE_${child.parcelId}`;

            // Reset Registers
            child.disputes = [];
            child.charges = [];

            await ctx.stub.putState(child.parcelId, Buffer.from(JSON.stringify(child)));
            createdChildren.push(child);
        }

        return createdChildren;
    }
}
