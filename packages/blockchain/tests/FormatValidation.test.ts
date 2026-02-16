
import * as sin from 'sinon';
import * as chai from 'chai';
import { FormatValidator } from '../src/logic/FormatValidator';

const expect = chai.expect;

describe('FormatValidator (Phase 29)', () => {

    describe('ULPIN', () => {
        it('should validate 14 digit numeric string', () => {
            expect(() => FormatValidator.validateULPIN('14092837465012')).to.not.throw();
        });
        it('should fail if length is not 14', () => {
            expect(() => FormatValidator.validateULPIN('123')).to.throw('Invalid ULPIN Format');
        });
        it('should fail if contains letters', () => {
            expect(() => FormatValidator.validateULPIN('1409283746501A')).to.throw('Invalid ULPIN Format');
        });
    });

    describe('CNR', () => {
        it('should validate 16 alphanumeric chars', () => {
            expect(() => FormatValidator.validateCNR('MHPNE10012342024')).to.not.throw();
        });
        it('should fail if length incorrect', () => {
            expect(() => FormatValidator.validateCNR('SHORT123')).to.throw('Invalid CNR Format');
        });
    });

    describe('RERA', () => {
        it('should validate P + 10-12 chars', () => {
            expect(() => FormatValidator.validateRERA('P52100012345')).to.not.throw();
        });
        it('should fail if no P prefix', () => {
            expect(() => FormatValidator.validateRERA('52100012345')).to.throw('Invalid RERA');
        });
    });

    describe('IPFS', () => {
        it('should validate Qm hash', () => {
            expect(() => FormatValidator.validateIPFS('QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco')).to.not.throw();
        });
        it('should fail if invalid start char', () => {
            expect(() => FormatValidator.validateIPFS('XmHasg...')).to.throw('Invalid IPFS');
        });
    });

    describe('Unit Conversion', () => {
        it('should convert Hectare to Guntha correctly', () => {
            // 1 Hectare = 2.471 Acres approx.
            // 1 Acre = 40 Gunthas.
            // 1 Hec = 98.84 Gunthas.
            const val = FormatValidator.calculateLocalUnit(1.0, 'GUNTHA');
            expect(val).to.be.closeTo(98.84, 0.1);
        });

        it('should convert Hectare to Cent correctly', () => {
            // 1 Hec = 247.1 Cents
            const val = FormatValidator.calculateLocalUnit(1.0, 'CENT');
            expect(val).to.be.closeTo(247.10, 0.1);
        });
    });
});
