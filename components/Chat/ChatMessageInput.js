import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function ChatMessageInput({ senderId, recipientId, onSend }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !recipientId) {
      console.warn("Missing message or recipient");
      return;
    }

    setSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: senderId,
          recipient_id: recipientId,
          content: message,
        },
      ])
      .select("*");

    setSending(false);

    if (error) {
      console.error("Send error:", error);
      return;
    }

    if (onSend) {
      onSend(data[0]);
    }

    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: "8px", padding: "10px" }}
    >
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{
          flex: 1,
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />

      <button
        type="submit"
        disabled={sending}
        style={{
          backgroundColor: sending ? "#6c757d" : "#007bff",
          color: "white",
          padding: "10px 16px",
          border: "none",
          borderRadius: "8px",
          cursor: sending ? "not-allowed" : "pointer",
        }}
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
