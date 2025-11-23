import { createClient } from '@supabase/supabase-js';
import { Database } from '@tweetbloom/types';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase Environment Variables');
}

// Admin Client (Bypasses RLS - Use carefully)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Helper to create a client scoped to the user's JWT (Respects RLS)
export const createUserClient = (jwt: string) => {
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        global: {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        },
    });
};
