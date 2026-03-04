import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VAPID_PUBLIC_KEY = 'BArEHen2I-y7OskFstFk4iZcV208JN5PB0GSnO8tCAW1MZ61DUPbZI46ZhT0DSVztvdXbdEl9scTXNX0Nk6qAtA';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!VAPID_PRIVATE_KEY) {
      throw new Error('VAPID_PRIVATE_KEY not configured');
    }

    webpush.setVapidDetails(
      'mailto:maurozujerroa@gmail.com',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    const { title, body, subscriptions } = await req.json();

    if (!title || !body || !subscriptions?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing title, body, or subscriptions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({ title, body, url: '/' });
    let sent = 0;
    const errors: string[] = [];
    const expiredEndpoints: string[] = [];

    // Initialize Supabase client to clean up expired subscriptions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
        sent++;
      } catch (err: any) {
        const statusCode = err.statusCode || err.status;
        console.error(`Failed to send to ${sub.endpoint}: status=${statusCode} message=${err.message}`);
        
        // 404 or 410 means the subscription is expired/invalid - clean it up
        if (statusCode === 404 || statusCode === 410 || statusCode === 403) {
          expiredEndpoints.push(sub.endpoint);
          console.log(`Marking subscription as expired: ${sub.endpoint}`);
        }
        
        errors.push(`status=${statusCode}: ${err.message}`);
      }
    }

    // Remove expired subscriptions from database
    if (expiredEndpoints.length > 0) {
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
      
      if (deleteError) {
        console.error('Failed to clean up expired subscriptions:', deleteError);
      } else {
        console.log(`Cleaned up ${expiredEndpoints.length} expired subscriptions`);
      }
    }

    return new Response(
      JSON.stringify({ 
        sent, 
        failed: errors.length, 
        expired_cleaned: expiredEndpoints.length,
        errors: errors.slice(0, 5) 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Push notification error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
