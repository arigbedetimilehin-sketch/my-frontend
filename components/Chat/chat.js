import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function Chat({ currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, user_id, content, created_at")
        .order("created_at", { ascending: true });

      if (!error) {
        setMessages(data);
      } else {
        console.error("❌ Load error:", error);
      }
    };

    loadMessages();

    // Subscribe to realtime inserts
    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          console.log("📩 New message:", payload.new);
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          user_id: currentUserId, // ✅ use user_id not user
          content: newMessage,   // ✅ use content not text
        },
      ])
      .select();

    if (error) {
      console.error("❌ Send error:", error);
    } else {
      console.log("✅ Sent:", data);
      setNewMessage("");
    }
  };

  return (
    <div className="p-4">
      <h2 className="font-bold mb-2">Messages</h2>

      <ul className="mb-4">
        {messages.map((msg) => (
          <li key={msg.id}>
            <b>{msg.user_id}</b>: {msg.content}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="border p-2 rounded flex-grow"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
