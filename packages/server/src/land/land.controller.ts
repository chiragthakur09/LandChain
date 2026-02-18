import { Controller, Get, Post, Body, Param, BadRequestException, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { FabricService } from '../fabric/fabric.service';
import { IdentityService } from '../identity/identity.service';
import { LandService } from './land.service';
import { Response } from 'express';
import {
    CreateParcelDto, InitiateTransferDto, ExecuteTransactionDto,
    SubdivideParcelDto, ConvertLandUseDto, RecordIntimationDto,
    ResolveDisputeDto, CreateStrataUnitDto, FinalizeTitleDto, ApproveMutationDto
} from './land.dto';

@ApiTags('Land Management')
@Controller('land')
export class LandController {
    constructor(
        private readonly fabricService: FabricService,
        private readonly identityService: IdentityService,
        private readonly landService: LandService
    ) { }



    @ApiOperation({ summary: 'Public Title Search (Sanitized)' })
    @ApiResponse({ status: 200, description: 'Returns redacted parcel details for public verification' })
    @Get('public/:id')
    async getPublicParcelDetails(@Param('id') id: string) {
        return this.fabricService.query('getPublicParcelDetails', id);
    }

    @ApiOperation({ summary: 'Create New Land Parcel (Genesis)' })
    @ApiResponse({ status: 201, description: 'Parcel Created successfully' })
    @Post()
    async createParcel(@Body() dto: CreateParcelDto) {
        const legacyJson = JSON.stringify(dto.legacyIdentifiers || {});
        const ownersJson = JSON.stringify(dto.owners);
        const spatialDataJson = JSON.stringify(dto.spatialData || {});
        return this.fabricService.submit('createParcel', dto.ulpin, ownersJson, dto.geoJson, dto.docHash, legacyJson, spatialDataJson);
    }

    @ApiOperation({ summary: 'Initiate Ownership Transfer (Step 1)' })
    @ApiResponse({ status: 201, description: 'Transfer Initiated. Status: PENDING_MUTATION' })
    @ApiResponse({ status: 403, description: 'Transfer blocked (LOCKED/DISPUTE)' })
    @Post('transfer')
    async initiateTransfer(@Body() dto: InitiateTransferDto) {
        // 1. Verify Auth Token (Mock Identity Check)
        if (!dto.authToken || !dto.authToken.startsWith('MOCK_AADHAAR_TOKEN_')) {
            throw new BadRequestException('Invalid or Missing Auth Token. Please Verify Identity first.');
        }

        const metadata = {
            stampDuty: dto.stampDuty,
            witnesses: dto.witnesses
        };
        const metadataJson = JSON.stringify(metadata);

        // Call 'initiateTransfer' chaincode function
        return this.fabricService.submit('initiateTransfer', dto.ulpin, dto.sellerId, dto.buyerId, dto.sharePercentage.toString(), dto.salePrice.toString(), dto.paymentUtr, metadataJson);
    }

    @ApiOperation({ summary: 'Approve Mutation (Step 2 - Registrar)' })
    @ApiResponse({ status: 201, description: 'Mutation Approved. Title Finalized.' })
    @Post('mutation/approve')
    async approveMutation(@Body() dto: ApproveMutationDto) {
        return this.fabricService.submit('approveMutation', dto.ulpin);
    }

    @ApiOperation({ summary: 'Get Payment Details (UTR)' })
    @Get('payment/:utr')
    async getPaymentDetails(@Param('utr') utr: string) {
        try {
            const payment = await this.fabricService.query('getPaymentDetails', utr);
            return payment;
        } catch (error) {
            throw new BadRequestException(`Payment ${utr} not found.`);
        }
    }

    @ApiOperation({ summary: 'Execute Generic Transaction (Pluggable)' })
    @Post('transaction')
    async executeTransaction(@Body() dto: ExecuteTransactionDto) {
        if (!dto.authToken || !dto.authToken.startsWith('MOCK_AADHAAR_TOKEN_')) {
            throw new BadRequestException('Invalid or Missing Auth Token.');
        }

        // Pass JSON string as expected by Chaincode
        const dataJson = JSON.stringify(dto.transactionData);
        return this.fabricService.submit('executeTransaction', dto.transactionType, dataJson, dto.evidenceHash);
    }

    @ApiOperation({ summary: 'Subdivide Parcel' })
    @Post('subdivide')
    async subdivideParcel(@Body() dto: SubdivideParcelDto) {
        return this.fabricService.submit('subdivideParcel', dto.parentUlpin, dto.childrenJson);
    }

    @ApiOperation({ summary: 'Convert Land Use (NA)' })
    @Post('convert')
    async convertLandUse(@Body() dto: ConvertLandUseDto) {
        return this.fabricService.submit('convertLandUse', dto.ulpin, dto.newUse);
    }

    @ApiOperation({ summary: 'Record Intimation (Court/Bank)' })
    @Post('intimation')
    async recordIntimation(@Body() dto: RecordIntimationDto) {
        return this.fabricService.submit('recordIntimation', dto.ulpin, dto.category, dto.type, dto.issuer, dto.details);
    }

    @ApiOperation({ summary: 'Resolve Dispute' })
    @Post('resolve')
    async resolveDispute(@Body() dto: ResolveDisputeDto) {
        return this.fabricService.submit('resolveDispute', dto.ulpin, dto.disputeId, dto.resolution);
    }

    @ApiOperation({ summary: 'Create Strata Unit (Vertical Property)' })
    @Post('strata')
    async createStrataUnit(@Body() dto: CreateStrataUnitDto) {
        return this.fabricService.submit('createStrataUnit', dto.ulpin, dto.parentUlpin, dto.floor.toString(), dto.carpetArea.toString(), dto.ownerId);
    }

    @ApiOperation({ summary: 'Finalize Title (Conclusive Transition)' })
    @Post('finalize')
    async finalizeTitle(@Body() dto: FinalizeTitleDto) {
        return this.fabricService.submit('finalizeTitle', dto.ulpin);
    }

    @ApiOperation({ summary: 'Get Pending Mutations (Registrar View)' })
    @Get('pending')
    async getPendingMutations() {
        return this.fabricService.query('queryPendingMutations');
    }

    @ApiOperation({ summary: 'Download Property Passbook PDF' })
    @ApiResponse({ status: 200, description: 'Returns PDF Stream' })
    @Get(':id/passbook')
    async downloadPassbook(@Param('id') id: string, @Res() res: Response) {
        return this.landService.generatePassbookPDF(id, res);
    }

    @ApiOperation({ summary: 'Get Land Parcel Details' })
    @ApiResponse({ status: 200, description: 'Returns the composite Land Parcel asset (RoT + RoD + RoCC)' })
    @ApiResponse({ status: 404, description: 'Asset not found' })
    @Get(':id')
    async getParcel(@Param('id') id: string) {
        return this.fabricService.query('getParcel', id);
    }
}
