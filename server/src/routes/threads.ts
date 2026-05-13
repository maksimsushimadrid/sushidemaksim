import { Router, Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config.js';
import { supabase } from '../db/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// 1. Start Authorization
router.get('/auth', (req: Request, res: Response) => {
    const appId = config.threads.appId;
    // We'll use the server URL for callback
    const redirectUri = `${config.frontendUrl}/api/threads/callback`;

    const authUrl = `https://www.threads.net/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=threads_basic&response_type=code`;

    res.redirect(authUrl);
});

// 2. Callback from Threads
router.get('/callback', async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('No authorization code provided');
    }

    try {
        const redirectUri = `${config.frontendUrl}/api/threads/callback`;

        // A. Exchange code for short-lived token
        const shortLivedResponse = await axios.post(
            'https://graph.threads.net/oauth/access_token',
            new URLSearchParams({
                client_id: config.threads.appId || '',
                client_secret: config.threads.appSecret || '',
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code: code as string,
            })
        );

        const shortLivedToken = shortLivedResponse.data.access_token;

        // B. Exchange for long-lived token (60 days)
        const longLivedResponse = await axios.get(
            `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${config.threads.appSecret}&access_token=${shortLivedToken}`
        );

        const longLivedToken = longLivedResponse.data.access_token;
        const expiresIn = longLivedResponse.data.expires_in;

        // C. Fetch user profile to get username
        const userProfileResponse = await axios.get(
            `https://graph.threads.net/v1.0/me?fields=id,username,name&access_token=${longLivedToken}`
        );
        const username = userProfileResponse.data.username;

        // D. Save to Supabase
        console.log(`DEBUG: Upserting Threads token for @${username} into DB...`);
        const { error: upsertError } = await supabase.from('integrations').upsert(
            {
                service: 'threads',
                access_token: longLivedToken,
                expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'service' }
        );

        if (upsertError) {
            console.error('DEBUG: Upsert Error:', upsertError);
            return res.status(500).send(`Failed to save token: ${upsertError.message}`);
        }

        console.log('DEBUG: Threads token saved successfully!');
        res.send('Successfully connected to Threads! You can close this window.');
    } catch (error: any) {
        console.error('Threads Auth Error:', error.response?.data || error.message);
        res.status(500).send(`Auth Error: ${error.message}`);
    }
});

// 2.1 Get Status (Admin only)
router.get(
    '/status',
    authMiddleware,
    adminMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const { data: integration, error } = await supabase
            .from('integrations')
            .select('service, updated_at, expires_at, access_token')
            .eq('service', 'threads')
            .maybeSingle();

        if (error) throw error;

        let username = null;
        if (integration?.access_token) {
            try {
                const userProfileResponse = await axios.get(
                    `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${integration.access_token}`
                );
                username = userProfileResponse.data.username;
            } catch (e) {
                console.warn('Failed to fetch Threads username:', e);
            }
        }

        res.json({
            connected: !!integration,
            username: username,
            last_sync: integration?.updated_at || null,
            expires_at: integration?.expires_at || null,
        });
    })
);

// 2.2 Disconnect (Admin only)
router.post(
    '/disconnect',
    authMiddleware,
    adminMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const { error } = await supabase.from('integrations').delete().eq('service', 'threads');

        if (error) throw error;

        res.json({ message: 'Threads disconnected successfully' });
    })
);

// 3. Sync Posts (Admin only)
router.post(
    '/sync',
    authMiddleware,
    adminMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        console.log('DEBUG: Starting Threads sync...');
        const isServiceRole = !!config.supabase.serviceRoleKey;
        console.log('DEBUG: Using Service Role Key:', isServiceRole);

        // A. Get token from DB
        const { data: integration, error: dbError } = await supabase
            .from('integrations')
            .select('*')
            .eq('service', 'threads')
            .maybeSingle();

        if (dbError || !integration || !integration.access_token) {
            console.error('DEBUG: Missing Threads credentials in DB', {
                dbError,
                hasIntegration: !!integration,
                isServiceRole,
            });
            return res.status(500).json({
                error: 'Missing API credentials',
                details: dbError
                    ? `DB Error: ${dbError.message}`
                    : !integration
                      ? `No record for "threads" in integrations table. (ServiceRole: ${isServiceRole})`
                      : `Token field is empty.`,
            });
        }

        // B. Fetch default admin and ensure 'Threads' category exists
        console.log('DEBUG: Fetching admin user...');
        const { data: admin, error: adminError } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin')
            .limit(1)
            .single();

        if (adminError || !admin) {
            console.error('DEBUG: Admin user not found:', adminError);
            return res.status(500).json({
                error: 'Configuration Error',
                details: 'No admin user found in database. Please create an admin user first.',
            });
        }

        console.log('DEBUG: Fetching/Creating Threads category...');
        let { data: category } = await supabase
            .from('tablon_categories')
            .select('id')
            .ilike('name', 'Threads')
            .maybeSingle();

        if (!category) {
            // Create the Threads category if it doesn't exist
            const { data: newCat, error: catError } = await supabase
                .from('tablon_categories')
                .insert({ name: 'Threads', emoji: '🧵', is_approved: true })
                .select('id')
                .single();

            if (catError) {
                // Fallback to any category if creation fails
                const { data: fallbackCat } = await supabase
                    .from('tablon_categories')
                    .select('id')
                    .limit(1)
                    .single();
                category = fallbackCat;
            } else {
                category = newCat;
            }
        }

        if (!admin || !category) {
            return res.status(500).json({ error: 'No admin or category found in DB' });
        }

        // C. Fetch posts from Threads Graph API
        const threadsResponse = await axios.get(
            `https://graph.threads.net/v1.0/me/threads?fields=id,media_type,media_url,permalink,text,timestamp,username&access_token=${integration.access_token}`
        );

        const posts = threadsResponse.data.data;
        let syncedCount = 0;
        let skippedCount = 0;

        // D. Save to tablon_posts
        for (const post of posts) {
            if (!post.text && !post.media_url) continue;

            // Check for duplicates using external_id
            const { data: existing } = await supabase
                .from('tablon_posts')
                .select('id')
                .eq('external_id', post.id)
                .maybeSingle();

            if (existing) {
                skippedCount++;
                continue;
            }

            const title = post.text
                ? post.text.slice(0, 50) + (post.text.length > 50 ? '...' : '')
                : 'Threads Post';

            // Generate a simple slug from title + short id for uniqueness
            const slug =
                title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '') || 'post';
            const uniqueSlug = `${slug}-${post.id.slice(0, 8)}`;

            const { error: insertError } = await supabase.from('tablon_posts').insert({
                user_id: admin.id,
                category_id: category.id,
                title: title,
                slug: uniqueSlug,
                message: post.text || '',
                images: post.media_url ? [post.media_url] : [],
                tags: ['threads'], // Clean tag
                whatsapp_phone: '',
                is_approved: false,
                moderation_status: 'pending',
                external_id: post.id,
                created_at: post.timestamp,
            });

            if (insertError) {
                console.error(`Error inserting post ${post.id}:`, insertError);
                continue;
            }
            syncedCount++;
        }

        res.json({
            message: `Successfully synced ${syncedCount} new posts from Threads`,
            stats: {
                insertedCount: syncedCount,
                skippedCount: skippedCount,
                totalFetched: posts.length,
            },
        });
    })
);

export default router;
