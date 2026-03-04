import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import webpush from 'npm:web-push@3.6.7';

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

    const payload = JSON.stringify({ title, body });
    let sent = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
        sent++;
      } catch (err: any) {
        console.error(`Failed to send to ${sub.endpoint}:`, err.message);
        errors.push(err.message);
      }
    }

    return new Response(
      JSON.stringify({ sent, failed: errors.length, errors: errors.slice(0, 5) }),
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
