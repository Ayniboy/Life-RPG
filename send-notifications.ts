// Supabase Edge Function — send-notifications
// Deploy: supabase functions deploy send-notifications
// Schedule: daily at 18:00 UTC in Supabase dashboard

import webpush from 'npm:web-push';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails(
  'mailto:noreply@liferp.game',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

Deno.serve(async () => {
  const yesterday = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?last_active=lt.${yesterday}&select=*`,
    { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
  );
  const subs = await res.json();

  if (!subs || subs.length === 0) {
    return new Response('No inactive users', { status: 200 });
  }

  let sent = 0;
  for (const sub of subs) {
    const streak = sub.streak || 0;
    let title = 'Life RPG ⚔';
    let body = 'Your adventure awaits. Log a deed today!';

    if (streak >= 30) body = `🔥 ${streak}-day streak! Don't stop now — log today's deeds.`;
    else if (streak >= 7) body = `⚡ ${streak} days strong! Keep the momentum going.`;
    else if (streak >= 3) body = `🌅 ${streak}-day streak at risk! Open the game and log a deed.`;
    else body = '⚔ A new day begins. What will you accomplish today, hero?';

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url: 'https://ayniboy.github.io/Life-RPG/' })
      );
      sent++;
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, {
          method: 'DELETE',
          headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
      }
    }
  }

  return new Response(`Sent ${sent} of ${subs.length} notifications`, { status: 200 });
});
