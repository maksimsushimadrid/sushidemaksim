import { describe, it, expect } from 'vitest';
import { cleanSpanishAddress } from '../routes/deliveryZones.js';

describe('cleanSpanishAddress Utility', () => {
    it('normalizes common starting street abbreviations', () => {
        expect(cleanSpanishAddress('c/ alcala 12')).toBe('calle alcala 12');
        expect(cleanSpanishAddress('cl/ mayor 45')).toBe('calle mayor 45');
        expect(cleanSpanishAddress('c. serrano 3')).toBe('calle serrano 3');
        expect(cleanSpanishAddress('c princesa 8')).toBe('calle princesa 8');
        expect(cleanSpanishAddress('av. de america 5')).toBe('avenida de america 5');
        expect(cleanSpanishAddress('avda de la albufera 9')).toBe('avenida de la albufera 9');
        expect(cleanSpanishAddress('pl. españa 1')).toBe('plaza españa 1');
        expect(cleanSpanishAddress('plz colón 2')).toBe('plaza colón 2');
        expect(cleanSpanishAddress('g.v. de la ilustracion')).toBe('gran via de la ilustracion');
        expect(cleanSpanishAddress('gv castellana 200')).toBe('gran via castellana 200');
        expect(cleanSpanishAddress('ctra. extremadura')).toBe('carretera extremadura');
        expect(cleanSpanishAddress('trav. de las flores')).toBe('travesía de las flores');
    });

    it('removes common house number prefix tags', () => {
        expect(cleanSpanishAddress('calle alcala nº 12')).toBe('calle alcala 12');
        expect(cleanSpanishAddress('calle mayor n° 45')).toBe('calle mayor 45');
        expect(cleanSpanishAddress('avenida de america num. 5')).toBe('avenida de america 5');
        expect(cleanSpanishAddress('plaza españa numero 1')).toBe('plaza españa 1');
    });

    it('handles mixed case and extra whitespace', () => {
        expect(cleanSpanishAddress('  C/  Serrano   Nº   15  ')).toBe('calle serrano 15');
    });

    it('does not touch name parts with similar letters in the middle of string', () => {
        expect(cleanSpanishAddress('calle carmen 12')).toBe('calle carmen 12');
        expect(cleanSpanishAddress('calle c 12')).toBe('calle c 12');
    });
});
