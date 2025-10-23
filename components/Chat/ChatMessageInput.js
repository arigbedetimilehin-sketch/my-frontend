import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function ChatMessageInput({ senderId, recipientId, onMessageSent }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: senderId,
          recipient_id: recipientId, // ✅ uses correct column
          content: message,
        },
      ])
      .select();

    setSending(false);

    if (error) {
      console.error("❌ Send message error:", error);
      alert("Message failed to send: " + error.message);
    } else {
      console.log("✅ Message sent:", data);
      setMessage("");
      if (onMessageSent) onMessageSent(data[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-2 border-t">
      <input
        type="text"
        placeholder="Type your message..."
        className="flex-grow border rounded-lg p-2 text-black"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={sending}
      />
      <button
        type="submit"
        className="bg-blue-500 text-white rounded-lg px-4 py-2"
        disabled={sending}
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
