import { Router, Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config.js';
import { supabase } from '../db/supabase.js';

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

        // C. Save to Supabase (assuming a 'settings' or 'integrations' table)
        const { error } = await supabase.from('integrations').upsert(
            {
                service: 'threads',
                access_token: longLivedToken,
                expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'service' }
        );

        if (error) throw error;

        res.send('Successfully connected to Threads! You can close this window.');
    } catch (error: any) {
        console.error('Threads Auth Error:', error.response?.data || error.message);
        res.status(500).send('Failed to authenticate with Threads');
    }
});

// 3. Sync Posts
router.get('/sync', async (req: Request, res: Response) => {
    try {
        // A. Get token from DB
        const { data: integration, error: dbError } = await supabase
            .from('integrations')
            .select('*')
            .eq('service', 'threads')
            .single();

        if (dbError || !integration) {
            return res
                .status(404)
                .json({ error: 'Threads integration not found. Please authenticate first.' });
        }

        // B. Fetch default admin and category
        const { data: admin } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin')
            .limit(1)
            .single();

        const { data: category } = await supabase
            .from('tablon_categories')
            .select('id')
            .limit(1)
            .single();

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
        let lastError = null;

        // D. Save to tablon_posts
        for (const post of posts) {
            if (!post.text && !post.media_url) continue;

            const threadTag = `threads:${post.id}`;

            // Check for duplicates
            const { data: existing } = await supabase
                .from('tablon_posts')
                .select('id')
                .contains('tags', [threadTag])
                .maybeSingle();

            if (existing) {
                skippedCount++;
                continue;
            }

            const title = post.text
                ? post.text.slice(0, 50) + (post.text.length > 50 ? '...' : '')
                : 'Threads Post';

            const { error: insertError } = await supabase.from('tablon_posts').insert({
                user_id: admin.id,
                category_id: category.id,
                title: title, // Added missing required field
                message: post.text || '',
                images: post.media_url ? [post.media_url] : [],
                tags: [threadTag, 'threads'],
                whatsapp_phone: '',
                is_approved: false,
                moderation_status: 'pending',
                created_at: post.timestamp,
            });

            if (insertError) {
                console.error(`Error inserting post ${post.id}:`, insertError);
                lastError = insertError;
                continue;
            }
            syncedCount++;
        }

        res.json({
            message: `Successfully synced ${syncedCount} new posts from Threads`,
            skipped: skippedCount,
            total_fetched: posts.length,
            debug: {
                adminId: admin.id,
                categoryId: category.id,
                lastError,
                firstPost: posts[0]
                    ? {
                          id: posts[0].id,
                          hasText: !!posts[0].text,
                          hasMedia: !!posts[0].media_url,
                      }
                    : null,
            },
        });
    } catch (error: any) {
        console.error('Threads Sync Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to sync posts',
            details: error.response?.data || error.message,
        });
    }
});

export default router;
