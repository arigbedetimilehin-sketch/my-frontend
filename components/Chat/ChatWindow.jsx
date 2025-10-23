import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import ChatMessage from "./ChatMessage";
import ChatMessageInput from "./ChatMessageInput";

export default function ChatWindow({ senderId, recipientId, sharedKey }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!senderId || !recipientId) {
      console.warn("⚠️ Missing sender or recipient");
      return;
    }

    // Load all messages between sender and recipient
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.'${senderId}',recipient_id.eq.'${recipientId}'),
           and(sender_id.eq.'${recipientId}',recipient_id.eq.'${senderId}')`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("❌ Error loading messages:", error);
      } else {
        console.log("📨 Loaded messages:", data);
        setMessages(data);
      }
    };

    loadMessages();

    // Realtime subscription for new messages
    const channel = supabase
      .channel("messages_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === senderId && newMsg.recipient_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.recipient_id === senderId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [senderId, recipientId]);

  return (
    <div className="flex flex-col h-[500px] border border-gray-300 rounded-2xl overflow-hidden">
      {/* Messages display */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isSender={msg.sender_id === senderId}
              sharedKey={sharedKey}
            />
          ))
        ) : (
          <p className="text-gray-500 text-center">No messages yet.</p>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 bg-white border-t">
        <ChatMessageInput
          senderId={senderId}
          recipientId={recipientId}
          onMessageSent={(m) => setMessages((prev) => [...prev, m])}
        />
      </div>
    </div>
  );
}
