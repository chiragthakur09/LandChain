import { ApiProperty } from '@nestjs/swagger';

export class VerifyAadhaarDto {
    @ApiProperty({ example: '1234-5678-9012', description: '12 Digit Aadhaar Number' })
    aadhaarNo: string;
}

export class SendOtpDto {
    @ApiProperty({ example: '1234-5678-9012' })
    aadhaarNo: string;
}

export class VerifyOtpDto {
    @ApiProperty({ example: 'session_123', description: 'Session ID from Send OTP' })
    sessionId: string;

    @ApiProperty({ example: '123456', description: '6 Digit OTP' })
    otp: string;
}
