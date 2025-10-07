import { supabase } from "../../supabaseClient";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, message, address } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // ✅ 1. Get the sender’s user profile (for sender name/email)
    const { data: profileData } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    // ✅ 2. Get trusted contacts for that user
    const { data: contacts, error: contactsError } = await supabase
      .from("trusted_contacts")
      .select("contact, name")
      .eq("user_id", userId);

    if (contactsError) throw contactsError;
    if (!contacts || contacts.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No trusted contacts found for this user." });
    }

    // ✅ 3. Create a panic alert message
    const alertMessage = `
      <h2 style="color:red;">🚨 Panic Alert</h2>
      <p><b>Emergency Alert!</b></p>
      <p>User <strong>${profileData?.email || "Unknown user"}</strong> has triggered a panic alert.</p>
      <p>Message: ${message || "Emergency! I need help."}</p>
      <p>Location: ${
        address
          ? `<a href="${address}" target="_blank">${address}</a>`
          : "No location provided"
      }</p>
      <p>Please reach out to them immediately.</p>
      <hr />
      <small>This alert was sent by EchoSignal Cloud.</small>
    `;

    // ✅ 4. Send to each trusted contact
    const sendPromises = contacts.map(async (c) => {
      try {
        await resend.emails.send({
          from: "EchoSignal <alerts@echosignal.cloud>",
          to: c.contact,
          subject: "🚨 Panic Alert from EchoSignal",
          html: alertMessage,
        });
      } catch (sendError) {
        console.error(`❌ Failed to send email to ${c.contact}:`, sendError);
      }
    });

    await Promise.all(sendPromises);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error sending panic alert emails:", err);
    return res.status(500).json({ error: err.message });
  }
}
