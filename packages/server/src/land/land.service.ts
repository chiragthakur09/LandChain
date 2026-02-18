import { Injectable, StreamableFile } from '@nestjs/common';
import { FabricService } from '../fabric/fabric.service';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { Response } from 'express';

@Injectable()
export class LandService {
    constructor(private readonly fabricService: FabricService) { }

    async getPropertyPassbookData(ulpin: string) {
        // Parallel Fetch: Current State + History
        const [current, history] = await Promise.all([
            this.fabricService.query('getParcel', ulpin),
            this.fabricService.query('GetParcelHistory', ulpin)
        ]);

        return { current, history };
    }

    async generatePassbookPDF(ulpin: string, res: Response) {
        const data = await this.getPropertyPassbookData(ulpin);
        const doc = new PDFDocument({ margin: 50 });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Passbook_${ulpin}.pdf`,
        });

        doc.pipe(res);

        // --- Header ---
        doc.fontSize(20).text('Government of India', { align: 'center' });
        doc.fontSize(14).text('Digital Land Property Passbook', { align: 'center' });
        doc.moveDown();
        doc.lineWidth(2).moveTo(50, 100).lineTo(550, 100).stroke();
        doc.moveDown();

        // --- Property Details ---
        doc.fontSize(12).font('Helvetica-Bold').text(`ULPIN: ${data.current.ulpin}`);

        // Parse ULPIN Components (2-8-4)
        const ulpinCode = data.current.ulpin;
        if (ulpinCode.length === 14) {
            const state = ulpinCode.substring(0, 2);
            const parcelId = ulpinCode.substring(2, 10);
            const subCode = ulpinCode.substring(10, 14);
            doc.fontSize(10).font('Helvetica').text(`  State Code: ${state} | Parcel ID: ${parcelId} | Subdivision: ${subCode}`);
        }

        doc.font('Helvetica').text(`Owner: ${data.current.title.owners.map(o => o.ownerId).join(', ')}`);
        doc.text(`Area: ${data.current.area} Sq. M.`);
        doc.text(`Land Use: ${data.current.landUseType}`);

        // --- Current Status (Balance Logic) ---
        const statusColor = data.current.status === 'FREE' ? 'green' : 'red';
        doc.fillColor(statusColor).font('Helvetica-Bold').text(`Current Status: ${data.current.status}`);
        doc.font('Helvetica').fillColor('black'); // Reset

        doc.moveDown();
        doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // --- Transactions History ---
        doc.fontSize(14).text('Immutable Transaction History', { underline: true });
        doc.moveDown();
        doc.fontSize(10);

        // Table Header
        let y = doc.y;
        doc.text('Date', 50, y);
        doc.text('Transaction Type', 150, y);
        doc.text('Status', 300, y);
        doc.text('TxID (Snippet)', 400, y);
        doc.moveDown();

        // Table Rows
        // History is array of { txId, timestamp, value, isDelete }
        // We sort by timestamp descending
        const sortedHistory = (Array.isArray(data.history) ? data.history : [])
            .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);

        for (const record of sortedHistory) {
            y = doc.y;
            const date = new Date(record.timestamp.seconds * 1000).toLocaleDateString();
            const txType = record.value?.status || (record.isDelete ? 'DELETED' : 'UNKNOWN'); // Infer type from state change if possible, or just status
            const txIdShort = record.txId.substring(0, 8) + '...';

            doc.text(date, 50, y);
            doc.text('STATE UPDATE', 150, y); // TODO: Enrich with specific Tx Type if stored
            doc.text(record.value?.status || 'N/A', 300, y);
            doc.text(txIdShort, 400, y);
            doc.moveDown();
        }

        // --- QR Code ---
        doc.addPage();
        doc.fontSize(14).text('Scan to Verify Online', { align: 'center' });
        doc.moveDown();

        const verificationUrl = `http://localhost:3000/verify/${ulpin}`;
        const qrImage = await QRCode.toDataURL(verificationUrl);
        doc.image(qrImage, { fit: [200, 200], align: 'center' });

        doc.fontSize(10).text(verificationUrl, { align: 'center', link: verificationUrl });

        doc.end();
    }
}
