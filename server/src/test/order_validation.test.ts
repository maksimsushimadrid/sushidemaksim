import { describe, it, expect } from 'vitest';
import { createOrderSchema, inviteOrderSchema } from '../schemas/order.schema.js';

describe('Order Schema Validation', () => {
    describe('createOrderSchema', () => {
        it('should validate a valid delivery order', async () => {
            const validOrder = {
                body: {
                    deliveryType: 'delivery',
                    address: 'Calle Mayor 123',
                    house: '2B',
                    phone: '+34600123456',
                    customerName: 'Test User',
                    paymentMethod: 'card',
                    guestsCount: 2,
                    chopsticksCount: 1,
                    isScheduled: false,
                },
            };
            const result = await createOrderSchema.safeParseAsync(validOrder);
            expect(result.success).toBe(true);
        });

        it('should fail if delivery address is missing for type "delivery"', async () => {
            const invalidOrder = {
                body: {
                    deliveryType: 'delivery',
                    phone: '+34600123456',
                    customerName: 'Test User',
                    isScheduled: false,
                },
            };
            const result = await createOrderSchema.safeParseAsync(invalidOrder);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'La dirección es obligatoria para el envío'
                );
            }
        });

        it('should fail if house is missing for type "delivery"', async () => {
            const invalidOrder = {
                body: {
                    deliveryType: 'delivery',
                    address: 'Calle Falsa 123',
                    phone: '+34600123456',
                    customerName: 'Test User',
                    isScheduled: false,
                },
            };
            const result = await createOrderSchema.safeParseAsync(invalidOrder);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('El número de casa es obligatorio');
            }
        });

        it('should validate a valid pickup order without address', async () => {
            const validPickup = {
                body: {
                    deliveryType: 'pickup',
                    phone: '+34600123456',
                    customerName: 'Test User',
                    paymentMethod: 'cash',
                    isScheduled: false,
                },
            };
            const result = await createOrderSchema.safeParseAsync(validPickup);
            expect(result.success).toBe(true);
        });

        it('should fail if phone is invalid', async () => {
            const invalidOrder = {
                body: {
                    deliveryType: 'pickup',
                    phone: '123',
                    customerName: 'Test User',
                },
            };
            const result = await createOrderSchema.safeParseAsync(invalidOrder);
            expect(result.success).toBe(false);
        });

        it('should require date and time if isScheduled is true', async () => {
            const invalidScheduled = {
                body: {
                    deliveryType: 'pickup',
                    phone: '+34600123456',
                    customerName: 'Test User',
                    isScheduled: true,
                },
            };
            const result = await createOrderSchema.safeParseAsync(invalidScheduled);
            expect(result.success).toBe(false);
            if (!result.success) {
                const messages = result.error.issues.map(i => i.message);
                expect(messages).toContain('Selecciona una fecha para el pedido anticipado');
                expect(messages).toContain('Selecciona una hora para el pedido anticipado');
            }
        });
    });

    describe('inviteOrderSchema', () => {
        it('should validate a valid invitation', async () => {
            const validInvite = {
                body: {
                    deliveryType: 'delivery',
                    address: 'Calle Amigo 456',
                    house: '1A',
                    phone: '+34611222333',
                    senderName: 'Your Friend',
                },
            };
            const result = await inviteOrderSchema.safeParseAsync(validInvite);
            expect(result.success).toBe(true);
        });
    });
});
