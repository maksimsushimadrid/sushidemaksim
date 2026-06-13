import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { supabase } from '../db/supabase.js';

async function testQuery() {
    console.log('--- Checking for unconfirmed registrations ---');

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, created_at, is_verified')
        .eq('is_verified', false)
        .is('google_id', null)
        .limit(1);

    if (error) {
        console.error('Error fetching unverified users:', error);
        return;
    }

    if (!users || users.length === 0) {
        console.log('No unverified users found in DB to test.');
        return;
    }

    const testUser = users[0];
    console.log(`Testing token generation for: ${testUser.name} (${testUser.email})`);

    // 1. Generate Token
    const verificationToken = jwt.sign(
        { userId: testUser.id, purpose: 'email_verification' },
        config.jwtSecret,
        { expiresIn: '24h' }
    );
    console.log('Generated JWT Token:', verificationToken);

    // 2. Validate Token (simulate verify endpoint payload check)
    try {
        const payload = jwt.verify(verificationToken, config.jwtSecret) as {
            userId: string;
            purpose: string;
        };
        console.log('Decoded Payload successfully:', payload);
        if (payload.userId === testUser.id && payload.purpose === 'email_verification') {
            console.log('✅ Token validation check: PASSED');
        } else {
            console.log('❌ Token validation check: FAILED (mismatched user ID or purpose)');
        }
    } catch (e: any) {
        console.error('❌ Token validation check: FAILED with error:', e.message);
    }
}

testQuery();
