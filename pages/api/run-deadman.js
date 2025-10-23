import { supabase } from "../../supabaseClient";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  try {
    // Find expired triggers
    const { data: expiredTriggers, error } = await supabase
      .from("deadman_triggers")
      .select("id, user_id, message, expires_at")
      .eq("active", true)
      .lt("expires_at", new Date().toISOString());

    if (error) throw error;

    for (const trigger of expiredTriggers) {
      // Get trusted contacts for that user
      const { data: contacts } = await supabase
        .from("trusted_contacts")
        .select("contact_email, contact_name")
        .eq("user_id", trigger.user_id);

      // Send email to each contact
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.ALERT_EMAIL,
          pass: process.env.ALERT_PASS,
        },
      });

      for (const contact of contacts) {
        await transporter.sendMail({
          from: `"EchoSignal Cloud" <${process.env.ALERT_EMAIL}>`,
          to: contact.contact_email,
          subject: "🚨 Deadman Alert",
          text: `Hello ${contact.contact_name},\n\n${trigger.message}\n\n— Sent automatically from EchoSignal Cloud.`,
        });
      }

      // Mark trigger as inactive
      await supabase
        .from("deadman_triggers")
        .update({ active: false })
        .eq("id", trigger.id);
    }

    res.status(200).json({ success: true, expiredTriggers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
