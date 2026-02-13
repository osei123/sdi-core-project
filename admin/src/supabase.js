import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://osajxngdxfnhskhjubpa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zYWp4bmdkeGZuaHNraGp1YnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDQyMzYsImV4cCI6MjA4MTAyMDIzNn0.UZYXgEqjyvStuWfNXFyxgR26_7QAY6FfERBgjj-d24I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
