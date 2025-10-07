import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // adjust path if needed

export default function ChatComponent({ user, receiverId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // ✅ Load messages between current user and receiver
  const loadMessages = async () => {
    if (!user || !receiverId || user.id === receiverId) {
      console.warn("⚠️ Skipping load — invalid or same user");
      return;
    }

    const query = `
      and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),
      and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})
    `.replace(/\s+/g, "");

    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(query)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Failed to fetch messages:", error);
    } else {
      console.log("✅ Messages loaded:", data);
      setMessages(data || []);
    }
  };

  // ✅ Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !receiverId || user.id === receiverId) {
      console.warn("⚠️ Cannot send message — missing receiver or invalid data");
      return;
    }

    const { error } = await supabase.from("direct_messages").insert([
      {
        sender_id: user.id,
        receiver_id: receiverId,
        content: newMessage.trim(),
      },
    ]);

    if (error) {
      console.error("❌ Failed to send message:", error);
    } else {
      setNewMessage("");
      loadMessages(); // refresh after sending
    }
  };

  useEffect(() => {
    loadMessages();
  }, [user, receiverId]);

  return (
    <div className="chat-container">
      <h2 className="font-semibold text-lg mb-2">Chat</h2>
      <div className="messages-box border p-3 rounded-lg h-64 overflow-y-auto bg-white text-black">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 my-1 rounded-lg ${
                msg.sender_id === user?.id
                  ? "bg-blue-500 text-white self-end text-right"
                  : "bg-gray-200 text-black self-start text-left"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
      </div>

      <div className="flex mt-3">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border p-2 rounded-l-lg text-black"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}

