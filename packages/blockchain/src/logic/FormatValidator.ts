
export class FormatValidator {

    // ULPIN: 14 Digits
    // Standard: Bhu-Aadhar (Unique Land Parcel Identification Number)
    static validateULPIN(ulpin: string): boolean {
        const ulpinRegex = /^\d{14}$/;
        if (!ulpinRegex.test(ulpin)) {
            throw new Error(`Invalid ULPIN Format. Must be 14 digits. Value: ${ulpin}`);
        }
        return true;
    }

    // CNR: 16 Alphanumeric
    // Standard: e-Courts Case Number Record
    static validateCNR(cnr: string): boolean {
        const cnrRegex = /^[a-zA-Z0-9]{16}$/;
        if (!cnrRegex.test(cnr)) {
            throw new Error(`Invalid CNR Format. Must be 16 alphanumeric characters. Value: ${cnr}`);
        }
        return true;
    }

    // RERA: P + StateCode (2 digits) + 000 + 6 digits (Example pattern for MahaRERA)
    // Generalizing to: Starts with P, alphanum, 10-15 chars?
    // User Example: P52100012345 -> P + numerical?
    // Let's use a generic catch-all for now: Start with P, followed by 10-12 alphanumeric.
    static validateRERA(reraId: string): boolean {
        // e.g. P52100012345
        const reraRegex = /^P[A-Z0-9]{10,12}$/;
        if (!reraRegex.test(reraId)) {
            throw new Error(`Invalid RERA Registration Format. Example: P52100012345. Value: ${reraId}`);
        }
        return true;
    }

    // Validation for IPFS Hash (Qm...)
    static validateIPFS(hash: string): boolean {
        const ipfsRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
        if (!ipfsRegex.test(hash)) {
            throw new Error(`Invalid IPFS Hash Format. Must start with Qm and be 46 chars. Value: ${hash}`);
        }
        return true;
    }

    // Utility: Convert Hectare to Local Unit
    static calculateLocalUnit(hectares: number, unit: 'GUNTHA' | 'BIGHA' | 'CENT' | 'ACRE'): number {
        // Base: 1 Hectare = 2.47105 Acres
        // 1 Acre = 40 Gunthas (approx, varies by state but widely used in MH/KA as 40)
        // 1 Acre = 100 Cents
        // Bigha varies wildly (0.25 to 0.6 Hectare). We'll use a standard conversion for POC (e.g. 1 Hectare = 3.95 Bigha - UP standard).

        const acres = hectares * 2.47105;

        switch (unit) {
            case 'ACRE': return Number(acres.toFixed(4));
            case 'GUNTHA': return Number((acres * 40).toFixed(2));
            case 'CENT': return Number((acres * 100).toFixed(2));
            case 'BIGHA': return Number((hectares * 3.95).toFixed(2)); // Approx
            default: return hectares;
        }
    }
}
