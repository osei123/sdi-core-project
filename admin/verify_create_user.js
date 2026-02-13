
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://osajxngdxfnhskhjubpa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zYWp4bmdkeGZuaHNraGp1YnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDQyMzYsImV4cCI6MjA4MTAyMDIzNn0.UZYXgEqjyvStuWfNXFyxgR26_7QAY6FfERBgjj-d24I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCreateUser() {
    console.log('Logging in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@sdi.com',
        password: 'Admin123!'
    });

    if (authError) {
        console.error('Login failed:', authError.message);
        process.exit(1);
    }
    console.log('Login successful.');

    const token = authData.session.access_token;

    const newUser = {
        email: `test_inspector_${Date.now()}@test.com`,
        password: 'password123',
        full_name: 'Test Inspector',
        role: 'inspector'
    };

    console.log('Calling create-user function (raw fetch)...');
    const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
    });

    console.log('Response Status:', response.status);
    const text = await response.text();
    console.log('Response Body:', text);

    if (!response.ok) {
        process.exit(1);
    }

    console.log('User created successfully.');
}

testCreateUser();
