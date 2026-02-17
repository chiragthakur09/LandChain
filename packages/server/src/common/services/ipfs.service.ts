
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class IpfsService implements OnModuleInit {
    private ipfs: any;

    async onModuleInit() {
        // Dynamic import to handle ESM-only package in NestJS (CommonJS)
        try {
            const { create } = await import('ipfs-http-client');
            this.ipfs = create({ url: 'http://localhost:5001' });
            console.log('IPFS Service initialized (Connected to localhost:5001)');
        } catch (error) {
            console.error('Failed to initialize IPFS client. Ensure IPFS Daemon is running.', error.message);
        }
    }

    async uploadFile(fileBuffer: Buffer): Promise<string> {
        if (!this.ipfs) {
             console.warn('IPFS not connected, returning Mock Hash');
             return `QmMockHash_${Date.now()}`;
        }

        try {
            const result = await this.ipfs.add(fileBuffer);
            console.log(`File uploaded to IPFS. Hash: ${result.path}`);
            return result.path;
        } catch (error) {
            console.error('IPFS Upload Failed', error);
            throw new Error('IPFS Upload Failed');
        }
    }
}
