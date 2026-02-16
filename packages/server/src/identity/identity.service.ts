import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class IdentityService {
    constructor(private jwtService: JwtService) { }

    // Mock UIDAI Database
    // In real world, this calls UIDAI API
    private validUsers = [
        { aadhaar: '999999990001', name: 'Ramesh Gupta', role: 'CITIZEN' },
        { aadhaar: '999999990002', name: 'Suresh Patil', role: 'CITIZEN' },
        { aadhaar: '111122223333', name: 'District Collector', role: 'ADMIN' } // DC
    ];

    private otpStore: Map<string, string> = new Map(); // Store OTPs in memory

    verifyAadhaar(aadhaarNo: string): boolean {
        // Mock Validation: Length must be 12 digits
        return /^\d{12}$/.test(aadhaarNo);
    }

    sendOtp(aadhaarNo: string): string {
        if (!this.verifyAadhaar(aadhaarNo)) {
            throw new Error('Invalid Aadhaar Number');
        }
        // Generate Mock OTP (Fixed for Vibe Coding ease, or random)
        const otp = '123456';
        const sessionId = Buffer.from(aadhaarNo + Date.now()).toString('base64');
        this.otpStore.set(sessionId, otp);

        console.log(`[Mock Aadhaar] OTP for ${aadhaarNo}: ${otp} (Session: ${sessionId})`);
        return sessionId;
    }

    verifyOtp(sessionId: string, otp: string): boolean {
        const storedOtp = this.otpStore.get(sessionId);
        if (storedOtp && storedOtp === otp) {
            this.otpStore.delete(sessionId); // One-time use
            return true;
        }
        return false;
    }

    login(aadhaar: string, otp: string) {
        if (otp === '123456') {
            const payload = { aadhaar: aadhaar, role: 'CITIZEN' };
            return {
                accessToken: this.jwtService.sign(payload)
            };
        }
        throw new Error('Invalid OTP');
    }
}
