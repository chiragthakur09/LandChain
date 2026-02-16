import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { IdentityService } from './identity.service';

@Controller('identity')
export class IdentityController {
    constructor(private readonly identityService: IdentityService) { }

    @Post('verify-aadhaar')
    verifyAadhaar(@Body() dto: { aadhaarNo: string }) {
        const isValid = this.identityService.verifyAadhaar(dto.aadhaarNo);
        return { valid: isValid };
    }

    @Post('send-otp')
    sendOtp(@Body() dto: { aadhaarNo: string }) {
        try {
            const sessionId = this.identityService.sendOtp(dto.aadhaarNo);
            return { message: 'OTP Sent', sessionId };
        } catch (e: any) {
            throw new BadRequestException(e.message);
        }
    }

    @Post('verify-otp')
    verifyOtp(@Body() dto: { sessionId: string, otp: string }) {
        const isValid = this.identityService.verifyOtp(dto.sessionId, dto.otp);
        if (!isValid) {
            throw new BadRequestException('Invalid OTP');
        }
        return { message: 'Identity Verified', token: 'MOCK_AADHAAR_TOKEN_' + dto.sessionId };
    }
}
