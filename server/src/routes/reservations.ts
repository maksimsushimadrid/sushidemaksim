import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateResource } from '../middleware/validateResource.js';
import { createReservationSchema } from '../schemas/reservation.schema.js';
import { isTimeWithinBusinessHours } from '../utils/storeStatus.js';
import { sendReservationEmail } from '../utils/email.js';

import { getMadridTodayString } from '../utils/helpers.js';

const router = Router();

// Create a new reservation
router.post(
    '/',
    validateResource(createReservationSchema),
    asyncHandler(async (req, res) => {
        const { name, email, phone, date, time, guests, notes, user_id } = req.body;

        // Check if reservations for TODAY are closed
        const today = getMadridTodayString();
        if (date === today) {
            const { data: settings } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'isReservationsTodayClosed')
                .maybeSingle();

            if (settings?.value === 'true') {
                return res.status(403).json({
                    error: `Lo sentimos, para hoy (${today}) todas las mesas están reservadas. Puedes reservar para cualquier otro día.`,
                });
            }
        }

        // Validate time within business hours using the generic string approach
        if (!isTimeWithinBusinessHours(date, time)) {
            return res
                .status(400)
                .json({ error: 'El restaurante está cerrado en el horario seleccionado' });
        }

        const { data: insertedData, error: insertError } = await supabase
            .from('reservations')
            .insert({
                name,
                email: email || 'guest@sushidemaksim.es',
                phone,
                reservation_date: date,
                reservation_time: time,
                guests,
                notes: notes || '',
                user_id: user_id || null,
                status: 'pending',
            })
            .select();

        if (insertError) {
            console.error('Supabase error inserting reservation:', insertError);
            throw insertError;
        }

        const data = insertedData && insertedData.length > 0 ? insertedData[0] : null;

        const dataForEmails = data || {
            name,
            email: email || 'guest@sushidemaksim.es',
            phone,
            reservation_date: date,
            reservation_time: time,
            guests,
            notes: notes || '',
        };

        // Send confirmation emails and wait for them so serverless doesn't kill the process
        try {
            await Promise.allSettled([
                sendReservationEmail(dataForEmails).catch(err =>
                    console.error('Error sending customer reservation email:', err)
                ),
                sendReservationEmail(dataForEmails, true).catch(err =>
                    console.error('Error sending admin reservation email:', err)
                ),
            ]);
        } catch (emailErr) {
            console.error('Email error (swallowed):', emailErr);
        }

        res.status(201).json(dataForEmails);
    })
);

// Get user reservations (authenticated)
router.get(
    '/my',
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('user_id', req.userId)
            .order('reservation_date', { ascending: false });

        if (error) throw error;

        res.json(data);
    })
);

export default router;
