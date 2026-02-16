import { LandParcel } from '../assets/LandParcel';

export class EncumbranceLogic {

    public static checkTransferability(parcel: LandParcel): { allowed: boolean; reason?: string } {
        if (parcel.status !== 'FREE') {
            return { allowed: false, reason: `Parcel status is ${parcel.status}` };
        }

        // Check RoD (Disputes)
        const activeDisputes = parcel.disputes.filter(d => d.status === 'PENDING');
        if (activeDisputes.length > 0) {
            return { allowed: false, reason: 'Pending Disputes detected' };
        }

        // Check RoCC (Charges)
        for (const charge of parcel.charges) {
            if (charge.active) {
                if (charge.type === 'MORTGAGE') return { allowed: false, reason: 'Active Mortgage detected' };
                if (charge.type === 'TAX_DEFAULT') return { allowed: false, reason: 'Tax Default detected' };
            }
        }

        return { allowed: true };
    }
}
