import { createClient } from '@supabase/supabase-js';
import { Database } from '@tweetbloom/types';
import { getEnv } from '../config/env';

const env = getEnv();

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

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
