// Vitest backend setup file
import { beforeAll, afterAll } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '3001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-characters-long';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock.supabase.co';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'mock-supabase-key';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'mock-supabase-key';

beforeAll(() => {
    // console.log('Backend Test Suite Starting...');
});

afterAll(() => {
    // console.log('Backend Test Suite Finished.');
});
