import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const token = authHeader.replace('Bearer ', '')
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        // 1. Verify Requestor (Must be Manager)
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

        if (userError || !user) {
            throw new Error(`Unauthorized: ${userError?.message || 'No user found'}`)
        }

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'manager') {
            throw new Error('Unauthorized: Manager role required')
        }

        // 2. Get Target ID from Body
        const { user_id } = await req.json()
        if (!user_id) throw new Error('Missing user_id')

        // 3. Prevent deleting self
        if (user_id === user.id) throw new Error('Cannot delete your own account')

        // 4. Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 5. Delete Related Data (Explicitly, to be safe & complete)
        // Note: Using Service Role, so RLS is bypassed.
        // We delete dependent data first to avoid foreign key constraints (if no cascade)
        console.log(`Deleting data for user: ${user_id}`)

        const { error: inspError } = await supabaseAdmin.from('inspections').delete().eq('inspector_id', user_id)
        if (inspError) console.error('Error deleting inspections:', inspError)

        const { error: qualError } = await supabaseAdmin.from('quality_reports').delete().eq('inspector_id', user_id)
        if (qualError) console.error('Error deleting quality reports:', qualError)

        const { error: profileDeleteError } = await supabaseAdmin.from('profiles').delete().eq('id', user_id)
        if (profileDeleteError) console.error('Error deleting profile:', profileDeleteError)

        // 6. Delete Auth User
        const { data: deleteData, error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

        if (deleteError) {
            console.error('Delete User Error:', deleteError)
            throw deleteError
        }

        return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
