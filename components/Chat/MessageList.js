import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";

export default function MessageList({ senderId, recipientId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Load error:", error);
      } else {
        setMessages(data || []);
        scrollToBottom();
      }

      setLoading(false);
    }

    if (senderId && recipientId) {
      fetchMessages();
    }
  }, [senderId, recipientId]);

  // Realtime subscription
  useEffect(() => {
    if (!senderId || !recipientId) return;

    const channel = supabase
      .channel("realtime:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === senderId &&
              newMsg.recipient_id === recipientId) ||
            (newMsg.sender_id === recipientId &&
              newMsg.recipient_id === senderId)
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
  }, [senderId, recipientId]);

  // Mark messages as read
  useEffect(() => {
    async function markAsRead() {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("recipient_id", senderId)
        .eq("sender_id", recipientId)
        .eq("is_read", false);
    }

    if (senderId && recipientId) {
      markAsRead();
    }
  }, [senderId, recipientId]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {loading ? (
        <div className="text-gray-500 text-center">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="text-gray-400 text-center">No messages yet</div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_id === senderId ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                msg.sender_id === senderId
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
