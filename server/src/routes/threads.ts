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
            return res.status(404).json({ error: 'Threads integration not found. Please authenticate first.' });
        }

        // B. Fetch posts from Threads Graph API
        const threadsResponse = await axios.get(
            `https://graph.threads.net/v1.0/me/threads?fields=id,media_product_type,media_type,media_url,permalink,owner,username,text,timestamp,shortcode,is_quote_post&access_token=${integration.access_token}`
        );

        const posts = threadsResponse.data.data;
        let syncedCount = 0;

        // C. Save to tablon_posts
        for (const post of posts) {
            // We only care about IMAGE or VIDEO or TEXT posts
            if (!post.text && !post.media_url) continue;

            const { error: upsertError } = await supabase.from('tablon_posts').upsert(
                {
                    external_id: post.id,
                    text: post.text || '',
                    image_url: post.media_url || null,
                    source: 'threads',
                    permalink: post.permalink,
                    created_at: post.timestamp,
                    // By default, mark as pending if you want manual approval, 
                    // or approved: true if you trust your Threads
                    approved: false, 
                    author_name: post.username,
                },
                { onConflict: 'external_id' }
            );

            if (!upsertError) syncedCount++;
        }

        res.json({
            message: `Successfully synced ${syncedCount} posts from Threads`,
            total_fetched: posts.length
        });

    } catch (error: any) {
        console.error('Threads Sync Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to sync posts',
            details: error.response?.data || error.message 
        });
    }
});

export default router;
