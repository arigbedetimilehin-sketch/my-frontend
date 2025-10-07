// pages/panic.js
import { useState } from "react";
import { supabase } from "../supabaseClient";
import Link from "next/link";

export default function Panic() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const handlePanic = async () => {
    setSending(true);
    setMessage("");

    // ✅ Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("You must be logged in to send a panic alert.");
      setSending(false);
      return;
    }

    // ✅ Get location (optional)
    let address = "Unknown location";
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      const { latitude, longitude } = pos.coords;
      address = `https://maps.google.com/?q=${latitude},${longitude}`;
    } catch (err) {
      console.warn("Location not available:", err.message);
    }

    // ✅ Save alert in Supabase
    const { error } = await supabase
      .from("panic_alerts")
      .insert([
        {
          user_id: user.id,
          message: "Emergency! I need help.",
          address,
        },
      ]);

    if (error) {
      console.error(error);
      setMessage("Failed to send panic alert: " + error.message);
      setSending(false);
      return;
    }

    // ✅ Notify trusted contacts via backend API
    const notify = await fetch("/api/send-panic-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        message: "Emergency! I need help.",
        address,
      }),
    });

    if (!notify.ok) {
      setMessage("Panic alert saved, but failed to notify trusted contacts.");
    } else {
      setMessage("✅ Panic alert sent successfully to your trusted contacts.");
    }

    setSending(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Panic Button</h1>
      <p>If you’re in danger, tap the button below to alert your trusted contacts.</p>

      <button
        onClick={handlePanic}
        disabled={sending}
        style={{
          backgroundColor: "#c00",
          color: "white",
          border: "none",
          padding: "12px 20px",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: "1.2em",
          marginTop: 20,
        }}
      >
        {sending ? "Sending Alert..." : "🚨 Send Panic Alert"}
      </button>

      {message && (
        <div style={{ marginTop: 16, color: "#333" }}>
          {message}
        </div>
      )}

      <p style={{ marginTop: 40 }}>
        <Link href="/trusted-contacts">← Back to Trusted Contacts</Link>
      </p>
    </div>
  );
}
