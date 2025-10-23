// utils/presence.js
import { supabase } from '../lib/supabaseClient';

let presenceChannel;

export async function startPresence(user) {
  if (!user) return;

  await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);

  // Broadcast presence to channel "presence"
  presenceChannel = supabase.channel(`presence-${user.id}`, {
    config: { broadcast: { self: true } }
  });

  await presenceChannel.subscribe(async (status) => {
    // no-op for now
  });

  // Broadcast a "status" message every 30s or when user unloads
  const broadcastStatus = () => {
    presenceChannel.send({
      type: 'broadcast',
      event: 'status',
      payload: { userId: user.id, last_seen: new Date().toISOString() }
    });
  };

  // initial
  broadcastStatus();

  const interval = setInterval(broadcastStatus, 30_000);

  const onUnload = () => {
    // Last update at disconnect
    supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
    try { presenceChannel.unsubscribe(); } catch (e) {}
  };

  window.addEventListener('beforeunload', onUnload);

  return {
    stop: () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', onUnload);
      try { presenceChannel.unsubscribe(); } catch (e) {}
    }
  };
}
