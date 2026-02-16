import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { FabricService } from '../fabric/fabric.service';
import { IdentityService } from '../identity/identity.service';
import {
    CreateParcelDto, TransferParcelDto, ExecuteTransactionDto,
    SubdivideParcelDto, ConvertLandUseDto, RecordIntimationDto,
    ResolveDisputeDto, CreateStrataUnitDto, FinalizeTitleDto
} from './land.dto';

@ApiTags('Land Management')
@Controller('land')
export class LandController {
    constructor(
        private readonly fabricService: FabricService,
        private readonly identityService: IdentityService
    ) { }

    @ApiOperation({ summary: 'Get Land Parcel Details' })
    @ApiResponse({ status: 200, description: 'Returns the composite Land Parcel asset (RoT + RoD + RoCC)' })
    @ApiResponse({ status: 404, description: 'Asset not found' })
    @Get(':id')
    async getParcel(@Param('id') id: string) {
        return this.fabricService.query('getParcel', id);
    }

    @ApiOperation({ summary: 'Create New Land Parcel (Genesis)' })
    @ApiResponse({ status: 201, description: 'Parcel Created successfully' })
    @Post()
    async createParcel(@Body() dto: CreateParcelDto) {
        return this.fabricService.submit('createParcel', dto.parcelId, dto.ownerId, dto.geoJson, dto.docHash);
    }

    @ApiOperation({ summary: 'Transfer Ownership (Sale Deed)' })
    @ApiResponse({ status: 201, description: 'Transfer successful' })
    @ApiResponse({ status: 403, description: 'Transfer blocked (LOCKED/DISPUTE)' })
    @Post('transfer')
    async transferParcel(@Body() dto: TransferParcelDto) {
        // 1. Verify Auth Token (Mock Identity Check)
        if (!dto.authToken || !dto.authToken.startsWith('MOCK_AADHAAR_TOKEN_')) {
            throw new BadRequestException('Invalid or Missing Auth Token. Please Verify Identity first.');
        }

        return this.fabricService.submit('transferParcel', dto.parcelId, dto.sellerId, dto.buyerId, dto.sharePercentage.toString(), dto.salePrice.toString(), dto.paymentUtr);
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
        return this.fabricService.submit('subdivideParcel', dto.parentParcelId, dto.childrenJson);
    }

    @ApiOperation({ summary: 'Convert Land Use (NA)' })
    @Post('convert')
    async convertLandUse(@Body() dto: ConvertLandUseDto) {
        return this.fabricService.submit('convertLandUse', dto.parcelId, dto.newUse);
    }

    @ApiOperation({ summary: 'Record Intimation (Court/Bank)' })
    @Post('intimation')
    async recordIntimation(@Body() dto: RecordIntimationDto) {
        return this.fabricService.submit('recordIntimation', dto.parcelId, dto.category, dto.type, dto.issuer, dto.details);
    }

    @ApiOperation({ summary: 'Resolve Dispute' })
    @Post('resolve')
    async resolveDispute(@Body() dto: ResolveDisputeDto) {
        return this.fabricService.submit('resolveDispute', dto.parcelId, dto.disputeId, dto.resolution);
    }

    @ApiOperation({ summary: 'Create Strata Unit (Vertical Property)' })
    @Post('strata')
    async createStrataUnit(@Body() dto: CreateStrataUnitDto) {
        return this.fabricService.submit('createStrataUnit', dto.unitId, dto.parentParcelId, dto.floor.toString(), dto.carpetArea.toString(), dto.ownerId);
    }

    @ApiOperation({ summary: 'Finalize Title (Conclusive Transition)' })
    @Post('finalize')
    async finalizeTitle(@Body() dto: FinalizeTitleDto) {
        return this.fabricService.submit('finalizeTitle', dto.parcelId);
    }
}
