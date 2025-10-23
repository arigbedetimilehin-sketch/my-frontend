import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // ✅ correct path if supabaseClient.js is in root/frontend

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // ✅ Load current user and set a receiver manually for now
  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("Auth error:", error);
      if (data?.user) {
        setUser(data.user);

        // ⚠️ Example: hardcode or fetch another user as receiver
        setReceiver({ id: "b1c2d3e4-fake-user-id", name: "EchoSignal AI" });
      }
    }
    loadUser();
  }, []);

  // ✅ Load messages between sender & receiver
  useEffect(() => {
    if (!user?.id || !receiver?.id) return;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${receiver.id}),and(sender_id.eq.${receiver.id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("❌ Load error:", error);
      } else {
        setMessages(data);
      }
    }

    loadMessages();

    // 🔄 Realtime updates
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === user.id &&
              newMsg.receiver_id === receiver.id) ||
            (newMsg.sender_id === receiver.id &&
              newMsg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, receiver]);

  // ✅ Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!user?.id || !receiver?.id) {
      console.error("❌ Sender or receiver not set");
      return;
    }

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: user.id,
        receiver_id: receiver.id,
        content: newMessage.trim(),
      },
    ]);

    if (error) {
      console.error("❌ Send error:", error);
    } else {
      setNewMessage("");
    }
  };

  if (!user || !receiver)
    return <p className="p-4 text-gray-500">Loading chat...</p>;

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="font-semibold text-xl mb-3">
        Chat with {receiver.name}
      </h2>

      <div className="h-96 overflow-y-auto border p-3 mb-3 rounded">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 my-1 rounded-lg ${
                msg.sender_id === user.id
                  ? "bg-blue-600 text-white text-right"
                  : "bg-gray-200 text-black text-left"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border p-2 rounded text-black"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
