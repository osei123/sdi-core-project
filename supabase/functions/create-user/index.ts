
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

        // Explicitly pass the token to getUser
        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser(token)

        if (userError || !user) {
            console.error('User error:', userError)
            throw new Error(`Unauthorized (getUser failed): ${userError?.message || 'No user found'}`)
        }

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'manager') {
            throw new Error(`Unauthorized: Manager role required (got ${profile?.role})`)
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const body = await req.json()
        const { email, password, full_name, role } = body

        if (!email || !password || !role) {
            throw new Error('Missing required fields')
        }

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name }
        })

        if (error) throw error

        if (data.user) {
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ role, full_name, username: email.split('@')[0] })
                .eq('id', data.user.id)

            if (updateError) console.error('Error updating profile:', updateError)
        }

        return new Response(JSON.stringify(data), {
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
