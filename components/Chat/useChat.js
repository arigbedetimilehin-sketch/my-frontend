// components/Chat/useChat.js
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function useDirectChat(sender, receiverId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🟢 Load all messages between sender and receiver
  useEffect(() => {
    if (!sender?.id || !receiverId) return;

    const loadMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${sender.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${sender.id})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("❌ Load messages error:", error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    loadMessages();

    // 🟢 Subscribe to real-time inserts
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new;
          if (
            (m.sender_id === sender.id && m.receiver_id === receiverId) ||
            (m.sender_id === receiverId && m.receiver_id === sender.id)
          ) {
            setMessages((prev) => [...prev, m]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sender?.id, receiverId]);

  // 🟣 Send a message
  const sendMessage = async (messageText) => {
    if (!sender?.id || !receiverId) {
      console.warn("⚠️ Sender or receiver missing");
      return;
    }

    const content =
      typeof messageText === "string" ? messageText.trim() : "";

    if (!content) {
      console.warn("⚠️ Empty message, not sending");
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: sender.id,
          receiver_id: receiverId,
          content,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("❌ Send message error:", error);
    } else if (data?.length) {
      // Show message immediately on sender's side
      setMessages((prev) => [...prev, data[0]]);
    }
  };

  // 🟡 Mark all unread messages as read when opening chat
  const markMessagesAsRead = async () => {
    if (!sender?.id || !receiverId) return;

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", sender.id)
      .eq("sender_id", receiverId)
      .eq("is_read", false);

    if (error) console.error("❌ Mark read error:", error);
  };

  return {
    messages,
    loading,
    sendMessage,
    markMessagesAsRead,
  };
}
