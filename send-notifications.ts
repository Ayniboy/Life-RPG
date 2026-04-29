// Supabase Edge Function — send-notifications
// Deploy to: supabase functions deploy send-notifications
// Schedule: every day at 18:00 UTC

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails('mailto:your@email.com', VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Get all push subscriptions not active in last 20 hours
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .lt('last_active', yesterday);

  if (!subs || subs.length === 0) {
    return new Response('No inactive users', { status: 200 });
  }

  let sent = 0;
  for (const sub of subs) {
    const streak = sub.streak || 0;
    let title = 'Life RPG ⚔';
    let body = 'Your adventure awaits. Log a deed today!';

    if (streak >= 7) {
      body = `🔥 Don't break your ${streak}-day streak! Open the game and log today's deeds.`;
    } else if (streak >= 3) {
      body = `⚡ ${streak} days strong! Keep the momentum — log a deed today.`;
    } else if (streak === 0) {
      body = '🌅 A new day begins. What deed will you log today, hero?';
    }

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify({ title, body, url: 'https://ayniboy.github.io/Life-RPG/' })
      );
      sent++;
    } catch (err) {
      // Remove invalid subscriptions
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }

  return new Response(`Sent ${sent} notifications`, { status: 200 });
});
