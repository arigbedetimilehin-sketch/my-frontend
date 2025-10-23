import { supabase } from "../../supabaseClient";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { userId } = req.body;

    // Get user's triggers
    const { data: triggers } = await supabase
      .from("deadman_triggers")
      .select("*")
      .eq("user_id", userId);

    // Get trusted contacts
    const { data: contacts } = await supabase
      .from("trusted_contacts")
      .select("email")
      .eq("user_id", userId);

    if (!contacts?.length) {
      return res.status(400).json({ error: "No trusted contacts found." });
    }

    // Create mailer transporter (using Gmail or your email provider)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ALERT_EMAIL,
        pass: process.env.ALERT_EMAIL_PASS,
      },
    });

    for (const contact of contacts) {
      const filesList = triggers
        .map((t) => {
          let section = `<p><b>Note:</b> ${t.content || "No text note"}</p>`;
          if (t.photo_url) section += `<p>📷 Photo: <a href="${t.photo_url}">${t.photo_url}</a></p>`;
          if (t.video_url) section += `<p>🎥 Video: <a href="${t.video_url}">${t.video_url}</a></p>`;
          if (t.voice_url) section += `<p>🎙 Voice Note: <a href="${t.voice_url}">${t.voice_url}</a></p>`;
          if (t.file_url) section += `<p>📁 File: <a href="${t.file_url}">${t.file_url}</a></p>`;
          return section;
        })
        .join("<hr>");

      const htmlBody = `
        <h2>⏰ Deadman Alert from EchoSignal Cloud</h2>
        <p>The timer for your contact has expired. Their stored files and messages are below:</p>
        ${filesList}
        <p>Stay safe and keep this information confidential.</p>
      `;

      await transporter.sendMail({
        from: `"EchoSignal Cloud" <${process.env.ALERT_EMAIL}>`,
        to: contact.email,
        subject: "⚡ Deadman Alert — Your Contact’s Files and Messages",
        html: htmlBody,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
