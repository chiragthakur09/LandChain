```typescript
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IdentityService } from './identity.service';
import { VerifyAadhaarDto, SendOtpDto, VerifyOtpDto } from './identity.dto';

@ApiTags('Identity')
@Controller('identity')
export class IdentityController {
    constructor(private readonly identityService: IdentityService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login via Aadhaar + Mock OTP (123456)' })
    async login(@Body() body: { aadhaar: string; otp: string }) {
        return this.identityService.login(body.aadhaar, body.otp);
    }

    @ApiOperation({ summary: 'Verify Aadhaar Existence' })
    @Post('verify-aadhaar')
    verifyAadhaar(@Body() dto: VerifyAadhaarDto) {
        const isValid = this.identityService.verifyAadhaar(dto.aadhaarNo);
        return { valid: isValid };
    }

    @ApiOperation({ summary: 'Send OTP for Authentication' })
    @Post('send-otp')
    sendOtp(@Body() dto: SendOtpDto) {
        try {
            const sessionId = this.identityService.sendOtp(dto.aadhaarNo);
            return { message: 'OTP Sent', sessionId };
        } catch (e: any) {
            throw new BadRequestException(e.message);
        }
    }

    @ApiOperation({ summary: 'Verify OTP and Get Token' })
    @ApiResponse({ status: 201, description: 'Token Generated' })
    @Post('verify-otp')
    verifyOtp(@Body() dto: VerifyOtpDto) {
        const isValid = this.identityService.verifyOtp(dto.sessionId, dto.otp);
        if (!isValid) {
            throw new BadRequestException('Invalid OTP');
        }
        return { message: 'Identity Verified', token: 'MOCK_AADHAAR_TOKEN_' + dto.sessionId };
    }
}
