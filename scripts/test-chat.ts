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

    // Test 4: Evaluate Chat (What Next?)
    console.log('\n--- Test 4: Evaluate Chat (What Next?) ---');
    // Use chatId from Test 2 (Good Prompt)
    const chatId = (data2 as any).chatId;
    if (chatId) {
        const res4 = await fetch('http://localhost:3001/api/chat/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify({
                chatId: chatId
            })
        });
        const data4 = await res4.json();
        console.log('Status:', res4.status);
        console.log('Response:', JSON.stringify(data4, null, 2));
    } else {
        console.log('Skipping Test 4 because Test 2 did not return a chatId');
    }

    // Test 5: Summarize Chat (Smart Notes)
    console.log('\n--- Test 5: Summarize Chat (Smart Notes) ---');
    if (chatId) {
        const res5 = await fetch('http://localhost:3001/api/notes/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify({
                chatId: chatId
            })
        });
        const data5 = await res5.json();
        console.log('Status:', res5.status);
        console.log('Response:', JSON.stringify(data5, null, 2));
    } else {
        console.log('Skipping Test 5 because Test 2 did not return a chatId');
    }

    // Test 5.5: Word Count Validation - Too Many Words
    console.log('\n--- Test 5.5: Word Count Validation (Too Many Words) ---');
    const tooManyWords = 'word '.repeat(151); // 151 words
    const res5_5 = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
            prompt: tooManyWords
        })
    });
    const data5_5 = await res5_5.json();
    console.log('Status:', res5_5.status);
    console.log('Response:', JSON.stringify(data5_5, null, 2));
    console.log('Expected: 400 Bad Request with word count error');

    // Test 5.6: Word Count Validation - Too Many Characters
    console.log('\n--- Test 5.6: Word Count Validation (Too Many Characters) ---');
    const tooManyChars = 'a'.repeat(1201); // 1201 characters
    const res5_6 = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
            prompt: tooManyChars
        })
    });
    const data5_6 = await res5_6.json();
    console.log('Status:', res5_6.status);
    console.log('Response:', JSON.stringify(data5_6, null, 2));
    console.log('Expected: 400 Bad Request with character limit error');

    // Test 6: Combine Notes
    console.log('\n--- Test 6: Combine Notes ---');
    // Create 2 dummy notes
    const { data: note1 } = await supabase.from('notes').insert({ user_id: authData.user.id, content: 'Note 1: React is a UI library.' }).select().single();
    const { data: note2 } = await supabase.from('notes').insert({ user_id: authData.user.id, content: 'Note 2: Vue is a progressive framework.' }).select().single();

    if (note1 && note2) {
        const res6 = await fetch('http://localhost:3001/api/notes/combine', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify({
                noteIds: [note1.id, note2.id]
            })
        });
        const data6 = await res6.json();
        console.log('Status:', res6.status);
        console.log('Response:', JSON.stringify(data6, null, 2));
    } else {
        console.log('Skipping Test 6 because failed to create dummy notes');
    }
}

main();
