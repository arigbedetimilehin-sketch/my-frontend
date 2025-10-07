// supabase/functions/panic-alert/index.ts

import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";

serve({
  "/": async (req) => {
    try {
      const { user_id, location, created_at } = await req.json();

      console.log("🚨 Panic Alert Triggered 🚨");
      console.log("User:", user_id);
      console.log("Time:", created_at);
      console.log("Location:", location);

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error in panic-alert function:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});