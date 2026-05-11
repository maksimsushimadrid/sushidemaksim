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

export default router;
