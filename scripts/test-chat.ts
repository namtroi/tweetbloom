import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from apps/api/.env
dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service key to bypass auth for creating user or just sign in

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Creating test user...');
    const email = `test-${Date.now()}@example.com`;
    const password = 'password123';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        console.error('Auth error:', authError);
        return;
    }

    console.log('User created:', authData.user.id);

    // Sign in to get JWT
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (signInError || !signInData.session) {
        console.error('Sign in error:', signInError);
        return;
    }

    const jwt = signInData.session.access_token;

    if (!jwt) {
        console.error('Could not get JWT');
        return;
    }

    console.log('Got JWT:', jwt.substring(0, 20) + '...');

    // Test 1: Bad Prompt
    console.log('\n--- Test 1: Bad Prompt ---');
    const res1 = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
            prompt: 'help'
        })
    });
    const data1 = await res1.json();
    console.log('Status:', res1.status);
    console.log('Response:', JSON.stringify(data1, null, 2));

    // Test 2: Good Prompt
    console.log('\n--- Test 2: Good Prompt ---');
    const res2 = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
            prompt: 'Explain quantum computing in simple terms.'
        })
    });
    const data2 = await res2.json();
    console.log('Status:', res2.status);
    console.log('Response:', JSON.stringify(data2, null, 2));

    // Test 3: Override
    console.log('\n--- Test 3: Override Bad Prompt ---');
    const res3 = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
            prompt: 'help',
            override_ai_check: true
        })
    });
    const data3 = await res3.json();
    console.log('Status:', res3.status);
    console.log('Response:', JSON.stringify(data3, null, 2));
}

main();
