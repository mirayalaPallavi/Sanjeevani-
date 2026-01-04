import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const { latitude, longitude, address, emergencyType, name } = await req.json();

        // 1. Insert into sos_events table
        const { data: sosEvent, error: dbError } = await supabaseClient
            .from('sos_events')
            .insert({
                user_id: user.id,
                user_name: name || user.email,
                latitude,
                longitude,
                address,
                emergency_type: emergencyType || 'General',
                status: 'active'
            })
            .select()
            .single();

        if (dbError) throw dbError;

        // 2. Trigger Email Alert (Simulation/Free Tier)
        // In a real production scenario with Resend API Key:
        // await fetch('https://api.resend.com/emails', { ... })

        console.log(`
      🚨 EMERGENCY SOS TRIGGERED 🚨
      --------------------------------
      Patient: ${name || user.email}
      Type: ${emergencyType}
      Location: https://maps.google.com/?q=${latitude},${longitude}
      Address: ${address || 'Unknown'}
      Time: ${new Date().toISOString()}
      --------------------------------
      [System] Email alert simulation: Email sent to emergency contacts.
    `);

        return new Response(JSON.stringify({ success: true, event: sosEvent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
