import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";

export default function MessageList({ sender, receiver }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // 🧠 Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 🔹 Fetch existing messages
  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender.eq.${sender},receiver.eq.${receiver}),and(sender.eq.${receiver},receiver.eq.${sender})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("❌ Failed to load messages:", error.message);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
      scrollToBottom();
    }

    fetchMessages();
  }, [sender, receiver]);

  // 🔹 Listen for new real-time messages
  useEffect(() => {
    const channel = supabase
      .channel("realtime:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new;
          // Only include messages for this specific chat
          if (
            (newMsg.sender === sender && newMsg.receiver === receiver) ||
            (newMsg.sender === receiver && newMsg.receiver === sender)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sender, receiver]);

  // 🔹 Mark messages as read when viewing
  useEffect(() => {
    async function markAsRead() {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver", sender)
        .eq("sender", receiver)
        .eq("is_read", false);
    }
    markAsRead();
  }, [sender, receiver]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {loading ? (
        <div className="text-gray-500 text-center">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="text-gray-400 text-center">No messages yet</div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === sender ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                msg.sender === sender
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
              <div className="text-[10px] text-gray-500 mt-1 text-right">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
