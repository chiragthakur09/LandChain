
import { Context } from 'fabric-contract-api';
import { LandParcel } from '../assets/LandParcel';
import { StrataUnit } from '../assets/StrataUnit';
import { FormatValidator } from './FormatValidator';

export class AdminValidator {

    /**
     * CNT/SPT Act Compliance: 
     * Tribal land transfers require Deputy Commissioner (DC) Approval.
     */
    public static async validateTribalTransfer(ctx: Context, parcel: LandParcel, txData: any): Promise<void> {
        // 1. Wakf Inalienability (Phase 26)
        if (parcel.isWakf) {
            throw new Error('Restricted: Wakf properties are LOCKED_FOR_ENDOWMENT. Sale is prohibited.');
        }

        // 2. Tribal Protection (CNT/SPT Act)
        if (parcel.isTribalProtected || parcel.landCategory === 'TRIBAL_SCHEDULED') {
            // In a real system, we would check if buyer is Non-Tribal. 
            // Here we check for explicit DC Permission Token.
            if (!txData.dcApprovalHash) {
                throw new Error(`Restricted: Tribal Land transfer requires District Collector (DC) Approval.`);
            }
        }
    }

    /**
     * RERA Compliance:
     * Strata Units cannot be handed over (SALE) without an Occupancy Certificate (OC).
     */
    public static async validateRERACompliance(ctx: Context, asset: any, txType: string): Promise<void> {
        // Check if Strata Unit
        if (asset.unitId && txType === 'SALE') {
            // 1. Check Occupancy Certificate (OC)
            if (!asset.ocDocumentHash || asset.ocDocumentHash === '') {
                throw new Error('RERA Compliance: Cannot Sell Strata Unit without Occupancy Certificate (OC).');
            }

            // 2. Validate RERA format if present
            if (asset.reraRegistrationNumber && asset.reraRegistrationNumber !== 'NOT_REGISTERED') {
                FormatValidator.validateRERA(asset.reraRegistrationNumber);
            }
        }
    }
    /**
     * Natural Justice: 30-Day Notice Period
     * Mutations are not instant; they enter a scrutiny phase.
     */
    public static determineMutationStatus(parcel: LandParcel): string {
        // In a real system, we would check if the notice period has expired.
        // For now, any new mutation request triggers the Scrutiny Status.
        return 'PENDING_SCRUTINY';
    }
}
