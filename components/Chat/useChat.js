import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient"; // ✅ adjust path if needed

export default function useDirectChat(user, receiverId) {
  const [messages, setMessages] = useState([]);

  // ✅ Load messages once
  const loadMessages = async () => {
    if (!user || !receiverId) return;

    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .in("sender_id", [user.id, receiverId])
      .in("receiver_id", [user.id, receiverId])
      .order("created_at", { ascending: true });

    if (error) console.error("❌ Failed to fetch messages:", error);
    else setMessages(data || []);
  };

  // ✅ Send new message
  const sendMessage = async (content) => {
    if (!content.trim() || !user || !receiverId) return;

    const { error } = await supabase.from("direct_messages").insert([
      {
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
      },
    ]);

    if (error) console.error("❌ Failed to send message:", error);
  };

  // ✅ Realtime updates
  useEffect(() => {
    loadMessages();
    if (!user || !receiverId) return;

    const channel = supabase
      .channel("realtime:direct_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id}))`,
        },
        (payload) => {
          console.log("💥 New message received:", payload.new);
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, receiverId]);

  return { messages, sendMessage };
}
