import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { IpfsService } from '../services/ipfs.service';
import { Express } from 'express';
import { Multer } from 'multer';

@ApiTags('IPFS / File Storage')
@Controller('ipfs')
export class IpfsController {
    constructor(private readonly ipfsService: IpfsService) { }

    @ApiOperation({ summary: 'Upload File to IPFS' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'File Uploaded', schema: { example: { hash: 'Qm...' } } })
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        const hash = await this.ipfsService.uploadFile(file.buffer);
        return { hash, url: `https://ipfs.io/ipfs/${hash}` };
    }
}
