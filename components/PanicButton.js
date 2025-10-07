import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function PanicButton({ userId }) {
  const [loading, setLoading] = useState(false);

  const sendPanicAlert = async () => {
    setLoading(true);

    // 1️⃣ Get location
    if (!navigator.geolocation) {
      alert("Geolocation not supported on this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // 2️⃣ Send panic alert to Supabase
        const { data, error } = await supabase.from("panic_alerts").insert([
          {
            user_id: userId,
            latitude,
            longitude,
            status: "active",
            created_at: new Date(),
          },
        ]);

        if (error) {
          console.error("❌ Panic alert error:", error.message);
          alert("Failed to send panic alert.");
        } else {
          console.log("✅ Panic alert sent:", data);
          alert("🚨 Panic alert sent successfully!");
        }

        setLoading(false);
      },
      (err) => {
        console.error("❌ Location error:", err);
        alert("Could not get your location.");
        setLoading(false);
      }
    );
  };

  return (
    <button
      onClick={sendPanicAlert}
      disabled={loading}
      className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold"
    >
      {loading ? "Sending..." : "🚨 Panic Button"}
    </button>
  );
}
