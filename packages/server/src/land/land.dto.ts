import { ApiProperty } from '@nestjs/swagger';

export class CreateParcelDto {
    @ApiProperty({ example: 'PARCEL_001', description: 'Unique ID of the Land Parcel (ULPIN)' })
    ulpin: string;

    @ApiProperty({ example: 'IND_CITIZEN_123', description: 'Owner ID' })
    ownerId: string;

    @ApiProperty({ example: '[[0,0],[0,10],[10,10],[10,0]]', description: 'GeoJSON coordinates' })
    geoJson: string;

    @ApiProperty({ example: 'QmHash...', description: 'IPFS Hash of Title Deed' })
    docHash: string;
}

export class TransferParcelDto {
    @ApiProperty({ example: 'PARCEL_001' })
    ulpin: string;

    @ApiProperty({ example: 'SELLER_ID' })
    sellerId: string;

    @ApiProperty({ example: 'BUYER_ID' })
    buyerId: string;

    @ApiProperty({ example: 100, description: 'Percentage of share being transferred' })
    sharePercentage: number;

    @ApiProperty({ example: 5000000, description: 'Sale Price in INR' })
    salePrice: number;

    @ApiProperty({ example: 'UTR123456', description: 'Bank Payment Reference' })
    paymentUtr: string;

    @ApiProperty({ example: 'MOCK_AADHAAR_TOKEN_...', description: 'Auth Token' })
    authToken: string;

    // Phase 34: Comprehensive Metadata
    @ApiProperty({ required: false, description: 'Stamp Duty Details' })
    stampDuty?: {
        challanNo: string;
        amount: number;
        date: number;
    };

    @ApiProperty({ required: false, description: 'Witness IDs/Hashes (Min 2)' })
    witnesses?: string[];
}

export class ExecuteTransactionDto {
    @ApiProperty({ example: 'SALE', enum: ['SALE', 'PARTITION', 'INHERITANCE', 'CONVERSION', 'APPROVE_MUTATION'] })
    transactionType: string;

    @ApiProperty({ example: { sellerId: 'A', buyerId: 'B', price: 100 }, description: 'Payload specific to transaction type' })
    transactionData: any;

    @ApiProperty({ example: 'QmEvidence...', description: 'IPFS Hash of supporting docs' })
    evidenceHash: string;

    @ApiProperty({ example: 'MOCK_AADHAAR_TOKEN_...' })
    authToken: string;
}

export class SubdivideParcelDto {
    @ApiProperty({ example: 'PARCEL_001' })
    parentUlpin: string;

    @ApiProperty({ example: '[{"ulpin":"PARCEL_001_1", ...}]', description: 'JSON string of children parcels' })
    childrenJson: string;
}

export class ConvertLandUseDto {
    @ApiProperty({ example: 'PARCEL_001' })
    ulpin: string;

    @ApiProperty({ example: 'NON_AGRICULTURAL', enum: ['AGRICULTURAL', 'NON_AGRICULTURAL', 'INDUSTRIAL'] })
    newUse: string;
}

export class RecordIntimationDto {
    @ApiProperty({ example: 'PARCEL_001' })
    ulpin: string;

    @ApiProperty({ example: 'CHARGE', enum: ['DISPUTE', 'CHARGE'] })
    category: 'DISPUTE' | 'CHARGE';

    @ApiProperty({ example: 'MORTGAGE' })
    type: string;

    @ApiProperty({ example: 'SBI_BANK' })
    issuer: string;

    @ApiProperty({ example: 'Loan Account 123456' })
    details: string;
}

export class ResolveDisputeDto {
    @ApiProperty({ example: 'PARCEL_001' })
    ulpin: string;

    @ApiProperty({ example: 'DISPUTE_001' })
    disputeId: string;

    @ApiProperty({ example: 'Dispute Resolved by Court Order...' })
    resolution: string;
}

export class CreateStrataUnitDto {
    @ApiProperty({ example: 'APT_101' })
    unitId: string;

    @ApiProperty({ example: 'PARCEL_001' })
    parentUlpin: string;

    @ApiProperty({ example: 5, description: 'Floor Number' })
    floor: number;

    @ApiProperty({ example: 1200, description: 'Carpet Area in Sq Ft' })
    carpetArea: number;

    @ApiProperty({ example: 'BUILDER_ID' })
    ownerId: string;
}

export class FinalizeTitleDto {
    @ApiProperty({ example: 'PARCEL_001' })
    ulpin: string;
}
