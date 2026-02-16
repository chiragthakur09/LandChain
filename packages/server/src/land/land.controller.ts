import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { FabricService } from '../fabric/fabric.service';
import { IdentityService } from '../identity/identity.service';

@Controller('land')
export class LandController {
    constructor(
        private readonly fabricService: FabricService,
        private readonly identityService: IdentityService
    ) { }

    @Get(':id')
    async getParcel(@Param('id') id: string) {
        return this.fabricService.query('getParcel', id);
    }

    @Post()
    async createParcel(@Body() createParcelDto: { parcelId: string, ownerId: string, geoJson: string, docHash: string }) {
        const { parcelId, ownerId, geoJson, docHash } = createParcelDto;
        return this.fabricService.submit('createParcel', parcelId, ownerId, geoJson, docHash);
    }

    @Post('transfer')
    async transferParcel(@Body() dto: { parcelId: string, sellerId: string, buyerId: string, sharePercentage: number, salePrice: number, authToken: string }) {
        // 1. Verify Auth Token (Mock Identity Check)
        if (!dto.authToken || !dto.authToken.startsWith('MOCK_AADHAAR_TOKEN_')) {
            throw new BadRequestException('Invalid or Missing Auth Token. Please Verify Identity first.');
        }

        return this.fabricService.submit('transferParcel', dto.parcelId, dto.sellerId, dto.buyerId, dto.sharePercentage.toString(), dto.salePrice.toString());
    }

    @Post('subdivide')
    async subdivideParcel(@Body() dto: { parentParcelId: string, childrenJson: string }) {
        return this.fabricService.submit('subdivideParcel', dto.parentParcelId, dto.childrenJson);
    }

    @Post('convert')
    async convertLandUse(@Body() dto: { parcelId: string, newUse: string }) {
        return this.fabricService.submit('convertLandUse', dto.parcelId, dto.newUse);
    }

    @Post('intimation')
    async recordIntimation(@Body() dto: { parcelId: string, category: 'DISPUTE' | 'CHARGE', type: string, issuer: string, details: string }) {
        return this.fabricService.submit('recordIntimation', dto.parcelId, dto.category, dto.type, dto.issuer, dto.details);
    }

    @Post('resolve')
    async resolveDispute(@Body() dto: { parcelId: string, disputeId: string, resolution: string }) {
        return this.fabricService.submit('resolveDispute', dto.parcelId, dto.disputeId, dto.resolution);
    }

    @Post('strata')
    async createStrataUnit(@Body() dto: { unitId: string, parentParcelId: string, floor: number, carpetArea: number, ownerId: string }) {
        return this.fabricService.submit('createStrataUnit', dto.unitId, dto.parentParcelId, dto.floor.toString(), dto.carpetArea.toString(), dto.ownerId);
    }

    @Post('finalize')
    async finalizeTitle(@Body() dto: { parcelId: string }) {
        return this.fabricService.submit('finalizeTitle', dto.parcelId);
    }
}
