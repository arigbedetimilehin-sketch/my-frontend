import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function useChat(senderId, recipientId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!senderId || !recipientId) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`
        )
        .order("created_at", { ascending: true });

      if (error) console.error("Load messages error:", error);
      if (data) setMessages(data);
    };

    loadMessages();

    const subscription = supabase
      .channel("message_updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;
          if (
            (newMessage.sender_id === senderId &&
              newMessage.recipient_id === recipientId) ||
            (newMessage.sender_id === recipientId &&
              newMessage.recipient_id === senderId)
          ) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [senderId, recipientId]);

  const sendMessage = async (content) => {
    if (!content.trim()) return;

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: senderId,
        recipient_id: recipientId,
        content,
      },
    ]);

    if (error) {
      console.error("Send message error:", error);
    }
  };

  return { messages, sendMessage };
}
