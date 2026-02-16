import { Injectable } from '@nestjs/common';

@Injectable()
export class IdentityService {
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
}
