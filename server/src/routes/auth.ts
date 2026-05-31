import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';
import { config } from '../config.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateResource } from '../middleware/validateResource.js';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    googleAuthSchema,
} from '../schemas/user.schema.js';

import { sendVerificationEmail, sendGoogleWelcomeEmail } from '../utils/email.js';
import { authLimiter, strictLimiter } from '../middleware/rateLimiters.js';
import { formatUser } from '../utils/helpers.js';

const router = Router();
// POST /api/auth/register
router.post(
    '/register',
    authLimiter,
    validateResource(registerSchema),
    asyncHandler(async (req, res: Response) => {
        const { name, email, phone, password, redirectTo } = req.body;

        const { data: existing } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email)
            .single();

        if (existing) {
            // If the user is unverified, resend the verification email
            if (!existing.is_verified && !existing.deleted_at) {
                console.log(`📧 [REGISTER] Resending verification email to ${email}...`);
                const verificationToken = jwt.sign(
                    { userId: existing.id, purpose: 'email_verification' },
                    config.jwtSecret,
                    { expiresIn: '24h' }
                );

                // Fetch registration settings for the promo code
                const { data: promo } = await supabase
                    .from('promo_codes')
                    .select('code, discount_percentage')
                    .eq('user_id', existing.id)
                    .eq('is_used', false)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                await sendVerificationEmail(
                    existing.email,
                    existing.name,
                    verificationToken,
                    promo?.code || '',
                    promo?.discount_percentage || 10,
                    redirectTo
                );

                return res.status(200).json({
                    success: true,
                    message:
                        'Ya existe una cuenta con este email. Hemos reenviado el enlace de activación.',
                });
            }

            // If the existing user is NOT archived, block registration
            if (!existing.deleted_at) {
                return res.status(409).json({ error: 'Ya existe una cuenta con este email' });
            }

            // If the existing user IS archived, PURGE them to allow re-registration
            console.log(
                `♻️  [AUTH] Purging archived user #${existing.id} to allow re-registration for ${email}...`
            );

            // 1. Get all order IDs
            const { data: orders } = await supabase
                .from('orders')
                .select('id')
                .eq('user_id', existing.id);
            const orderIds = (orders || []).map(o => o.id);

            // 2. Cascade deletion
            await Promise.all([
                orderIds.length > 0
                    ? supabase.from('order_items').delete().in('order_id', orderIds)
                    : Promise.resolve(),
                supabase.from('orders').delete().eq('user_id', existing.id),
                supabase.from('user_addresses').delete().eq('user_id', existing.id),
                supabase.from('promo_codes').delete().eq('user_id', existing.id),
                supabase.from('cart_items').delete().eq('user_id', existing.id),
                supabase.from('user_favorites').delete().eq('user_id', existing.id),
                supabase.from('password_resets').delete().eq('user_id', existing.id),
            ]);

            // 3. Delete the user itself
            await supabase.from('users').delete().eq('id', existing.id);
        }

        const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                phone: phone?.trim() || '',
                password_hash: passwordHash,
                last_seen_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Generate verification token (JWT)
        const verificationToken = jwt.sign(
            { userId: newUser.id, purpose: 'email_verification' },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        // Fetch registration settings
        const { data: settingsData } = await supabase
            .from('site_settings')
            .select('key, value')
            .in('key', [
                'loyalty_registration_bonus_enabled',
                'loyalty_registration_bonus_percent',
            ]);

        const settings: Record<string, string> = {};
        settingsData?.forEach(s => (settings[s.key] = s.value));

        const regEnabled = settings['loyalty_registration_bonus_enabled'] === 'true';
        const regPercent = parseInt(settings['loyalty_registration_bonus_percent']) || 10;

        let promoCode = '';
        if (regEnabled) {
            // Create welcome promo code (valid for 1 day)
            const promoSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
            promoCode = `NUEVO${regPercent}-${promoSuffix}`;

            await supabase.from('promo_codes').insert({
                code: promoCode,
                discount_percentage: regPercent,
                user_id: newUser.id,
                is_used: false,
            });
        }

        const verificationLink = `${config.frontendUrl}/verify?token=${verificationToken}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;

        // Send verification email
        try {
            console.log(`📡 [REGISTER] Attempting to send email to ${newUser.email}...`);
            await sendVerificationEmail(
                newUser.email,
                newUser.name,
                verificationToken,
                promoCode,
                regPercent,
                redirectTo
            );
            console.log(`✅ [REGISTER] Verification email SENT to ${newUser.email}`);
        } catch (e: any) {
            console.error('❌ [REGISTER] SMTP ERROR:', e.message || e);
            console.warn(
                `\n🔑 [TESTING / FALLBACK] Link de activación manual:\n${verificationLink}\n`
            );
        }

        res.status(201).json({
            success: true,
            message: 'Usuario registrado. Por favor, verifica tu email.',
        });
    })
);

// GET /api/auth/verify/:token
router.get(
    '/verify/:token',
    asyncHandler(async (req, res: Response) => {
        const { token } = req.params;

        try {
            const payload = jwt.verify(token, config.jwtSecret) as {
                userId: string;
                purpose: string;
            };

            if (payload.purpose !== 'email_verification') {
                return res.status(400).json({ error: 'Token inválido' });
            }

            const { data: user, error: findError } = await supabase
                .from('users')
                .select('id, is_verified')
                .eq('id', payload.userId)
                .single();

            if (findError || !user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            if (user.is_verified) {
                // Generate login token even if already verified (magic link login)
                const loginToken = jwt.sign({ userId: user.id }, config.jwtSecret, {
                    expiresIn: config.jwtExpiresIn,
                });

                const { data: fullUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                return res.json({
                    success: true,
                    token: loginToken,
                    user: fullUser ? formatUser(fullUser) : null,
                    message: 'La cuenta ya estaba verificada.',
                });
            }

            const { error: updateError } = await supabase
                .from('users')
                .update({ is_verified: true, birth_date_verified: true })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Generate login token immediately after verification
            const loginToken = jwt.sign({ userId: user.id }, config.jwtSecret, {
                expiresIn: config.jwtExpiresIn,
            });

            // Fetch the full user data for formatUser
            const { data: fullUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            res.json({
                success: true,
                token: loginToken,
                user: fullUser ? formatUser(fullUser) : null,
                message: '¡Cuenta activada con éxito!',
            });
        } catch (err) {
            res.status(400).json({ error: 'El enlace de activación ha expirado o es inválido.' });
        }
    })
);

// GET /api/auth/verify-email-change/:token
router.get(
    '/verify-email-change/:token',
    asyncHandler(async (req, res: Response) => {
        const { token } = req.params;

        try {
            const payload = jwt.verify(token, config.jwtSecret) as {
                userId: string;
                purpose: string;
                newEmail: string;
            };

            if (payload.purpose !== 'email_change') {
                return res.status(400).json({ error: 'Token inválido' });
            }

            const { data: user, error: findError } = await supabase
                .from('users')
                .select('id, email, pending_email')
                .eq('id', payload.userId)
                .single();

            if (findError || !user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            if (user.pending_email !== payload.newEmail) {
                return res
                    .status(400)
                    .json({ error: 'Este enlace de verificación ya no es válido.' });
            }

            const { error: updateError } = await supabase
                .from('users')
                .update({
                    old_email: user.email,
                    email: payload.newEmail,
                    pending_email: null,
                    email_last_changed_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            res.json({
                success: true,
                message: '¡Tu email ha sido actualizado con éxito!',
            });
        } catch (err) {
            res.status(400).json({ error: 'El enlace de verificación ha expirado o es inválido.' });
        }
    })
);

// POST /api/auth/login
router.post(
    '/login',
    authLimiter,
    validateResource(loginSchema),
    asyncHandler(async (req, res: Response) => {
        const { email, password } = req.body;

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email.trim())
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }

        if (user.is_verified === false) {
            return res.status(403).json({
                error: 'Por favor, activa tu cuenta. Revisa tu email para el enlace de confirmación.',
            });
        }

        // Reactivate account if it was marked for deletion
        let wasDeleted = false;
        if (user.deleted_at) {
            await supabase.from('users').update({ deleted_at: null }).eq('id', user.id);
            wasDeleted = true;
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }

        const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn,
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash, created_at, birth_date, birth_date_verified, ...userRest } = user;
        res.json({
            token,
            wasReactivated: wasDeleted,
            user: formatUser(user),
        });
    })
);

// GET /api/auth/me
router.get(
    '/me',
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { data: user, error } = await supabase
            .from('users')
            .select(
                'id, name, email, phone, avatar, role, is_superadmin, created_at, birth_date, birth_date_verified, last_seen_at, is_verified, coins_balance'
            )
            .eq('id', req.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const { data: addresses, error: addrError } = await supabase
            .from('user_addresses')
            .select('id, label, street, house, apartment, city, postal_code, phone, is_default')
            .eq('user_id', req.userId)
            .order('is_default', { ascending: false });

        if (addrError) throw addrError;

        const { count: orderCount, error: orderError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.userId);

        if (orderError) throw orderError;

        const { data: promoCodes, error: promoError } = await supabase
            .from('promo_codes')
            .select('code, discount_percentage, is_used, created_at')
            .eq('user_id', req.userId)
            .eq('is_used', false)
            .order('created_at', { ascending: false });

        if (promoError) throw promoError;

        res.json({
            user: formatUser(
                user,
                orderCount || 0,
                addresses || [],
                0,
                0,
                'N/A',
                'N/A',
                promoCodes || []
            ),
        });
    })
);

// POST /api/auth/forgot-password
router.post(
    '/forgot-password',
    strictLimiter,
    validateResource(forgotPasswordSchema),
    asyncHandler(async (req, res: Response) => {
        const { email } = req.body;

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email')
            .ilike('email', email.trim())
            .single();

        if (userError || !user) {
            // Security: Don't leak if email exists. Return 200 in both cases.
            return res.json({
                success: true,
                message: 'Si tu email está registrado, recibirás un código pronto.',
            });
        }

        // Cooldown: 60 seconds
        const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { data: recentCode } = await supabase
            .from('password_resets')
            .select('created_at')
            .eq('user_id', user.id)
            .gt('created_at', sixtySecondsAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (recentCode) {
            return res.status(429).json({
                error: 'Ya enviamos un código. Espera 1 minuto antes de intentarlo de nuevo.',
            });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        // Invalidate previous
        await supabase
            .from('password_resets')
            .update({ used: true })
            .eq('user_id', user.id)
            .eq('used', false);

        // Store new
        await supabase
            .from('password_resets')
            .insert({ user_id: user.id, code, expires_at: expiresAt });

        // Send email
        try {
            const { sendResetCodeEmail } = await import('../utils/email.js');
            await sendResetCodeEmail(user.email, code);
            console.log(`📧 Reset code sent to ${user.email}`);
        } catch (err) {
            console.error('❌ Failed to send reset email:', err);
            return res.status(500).json({ error: 'Error al enviar el email. Inténtalo de nuevo.' });
        }

        res.json({ success: true, message: 'Código enviado a tu email.' });
    })
);

// POST /api/auth/reset-password
router.post(
    '/reset-password',
    strictLimiter,
    validateResource(resetPasswordSchema),
    asyncHandler(async (req, res: Response) => {
        const { email, code, newPassword } = req.body;

        const { data: user } = await supabase
            .from('users')
            .select('id')
            .ilike('email', email.trim())
            .single();

        if (!user) {
            return res.status(400).json({ error: 'Código inválido o expirado' });
        }

        const { data: resetRecord, error } = await supabase
            .from('password_resets')
            .select('*')
            .eq('user_id', user.id)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !resetRecord) {
            return res.status(400).json({ error: 'Código inválido o expirado' });
        }

        if (resetRecord.attempts >= 5) {
            await supabase.from('password_resets').update({ used: true }).eq('id', resetRecord.id);
            return res
                .status(400)
                .json({ error: 'Demasiados intentos fallidos. Solicita un nuevo código.' });
        }

        if (resetRecord.code !== code) {
            await supabase
                .from('password_resets')
                .update({ attempts: resetRecord.attempts + 1 })
                .eq('id', resetRecord.id);
            const remaining = 4 - resetRecord.attempts;
            return res.status(400).json({
                error: `Código incorrecto. ${remaining > 0 ? `Te quedan ${remaining} intento${remaining > 1 ? 's' : ''}.` : 'Solicita un nuevo código.'}`,
            });
        }

        // Success
        const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
        await Promise.all([
            supabase.from('password_resets').update({ used: true }).eq('id', resetRecord.id),
            supabase.from('users').update({ password_hash: passwordHash }).eq('id', user.id),
        ]);

        console.log(`🔑 Password reset for user ${user.id}`);

        res.json({ success: true, message: 'Contraseña actualizada con éxito.' });
    })
);

// POST /api/auth/google
router.post(
    '/google',
    authLimiter,
    validateResource(googleAuthSchema),
    asyncHandler(async (req, res: Response) => {
        const { access_token } = req.body;

        let payload;
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user info from Google');
            }

            payload = await response.json();
        } catch (error) {
            console.error('Google Auth Error:', error);
            return res.status(401).json({ error: 'Token de Google inválido o expirado' });
        }

        if (!payload || !payload.email) {
            return res.status(401).json({ error: 'No se pudo obtener el email de Google' });
        }

        const { sub: googleId, email, name, picture: avatarUrl } = payload;

        // 1. Try to find user by google_id
        let { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('google_id', googleId)
            .single();

        // 2. If not found by google_id, try finding by email
        if (!user) {
            const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .ilike('email', email)
                .single();

            if (existingUser) {
                // Link Google account to existing user
                const { data: updatedUser, error: linkError } = await supabase
                    .from('users')
                    .update({
                        google_id: googleId,
                        avatar_url: avatarUrl || existingUser.avatar_url,
                        is_verified: true, // OAuth emails are verified
                    })
                    .eq('id', existingUser.id)
                    .select('*')
                    .single();

                if (linkError) throw linkError;
                user = updatedUser;
            } else {
                // 3. Create new user
                // Generate a random placeholder password hash for OAuth-only users
                // (they authenticate via Google, never via password)
                const placeholderHash = await bcrypt.hash(
                    `oauth_${googleId}_${Date.now()}`,
                    config.bcryptRounds
                );
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert({
                        email: email.toLowerCase(),
                        name: name || email.split('@')[0],
                        google_id: googleId,
                        avatar_url: avatarUrl,
                        is_verified: true,
                        role: 'user',
                        password_hash: placeholderHash,
                    })
                    .select('*')
                    .single();

                if (createError) throw createError;
                user = newUser;

                // Generate welcome promo code for Google OAuth new users
                const { data: settingsData } = await supabase
                    .from('site_settings')
                    .select('key, value')
                    .in('key', [
                        'loyalty_registration_bonus_enabled',
                        'loyalty_registration_bonus_percent',
                    ]);

                const settings: Record<string, string> = {};
                settingsData?.forEach(s => (settings[s.key] = s.value));

                const regEnabled = settings['loyalty_registration_bonus_enabled'] === 'true';
                const regPercent = parseInt(settings['loyalty_registration_bonus_percent']) || 10;

                if (regEnabled && newUser) {
                    const promoSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
                    const promoCode = `NUEVO${regPercent}-${promoSuffix}`;

                    await supabase.from('promo_codes').insert({
                        code: promoCode,
                        discount_percentage: regPercent,
                        user_id: newUser.id,
                        is_used: false,
                    });

                    // Generate magic login token for the welcome email (expires in 7 days)
                    const magicToken = jwt.sign(
                        { userId: newUser.id, role: newUser.role || 'user' },
                        config.jwtSecret,
                        { expiresIn: '7d' }
                    );

                    // Fire-and-forget: send welcome email with promo code + magic link
                    sendGoogleWelcomeEmail(
                        newUser.email,
                        newUser.name || email.split('@')[0],
                        promoCode,
                        regPercent,
                        magicToken
                    ).catch(e =>
                        console.error('❌ Failed to send Google welcome email:', e.message || e)
                    );
                }
            }
        }

        if (!user) {
            return res.status(500).json({ error: 'Error al procesar el usuario' });
        }

        // Generate project JWT
        const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn,
        });

        res.json({
            token,
            user: formatUser(user),
        });
    })
);

export default router;
