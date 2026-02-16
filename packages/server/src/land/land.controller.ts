import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { FabricService } from '../fabric/fabric.service';

@Controller('land')
export class LandController {
    constructor(private readonly fabricService: FabricService) { }

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
    async transferParcel(@Body() transferDto: { parcelId: string, newOwnerId: string, salePrice: number }) {
        const { parcelId, newOwnerId, salePrice } = transferDto;
        return this.fabricService.submit('transferParcel', parcelId, newOwnerId, salePrice.toString());
    }

    @Post('subdivide')
    async subdivideParcel(@Body() dto: { parentParcelId: string, childrenJson: string }) {
        // childrenJson should be stringified array of children objects
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

    @Post('strata')
    async createStrataUnit(@Body() dto: { unitId: string, parentParcelId: string, floor: number, carpetArea: number, ownerId: string }) {
        return this.fabricService.submit('createStrataUnit', dto.unitId, dto.parentParcelId, dto.floor.toString(), dto.carpetArea.toString(), dto.ownerId);
    }

    @Post('finalize')
    async finalizeTitle(@Body() dto: { parcelId: string }) {
        return this.fabricService.submit('finalizeTitle', dto.parcelId);
    }
}
