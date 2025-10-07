import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import Chat from "../components/Chat";

export default function ChatPage() {
  const [user, setUser] = useState(null);

  // Get current logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("Error getting user:", error);
      else setUser(data.user);
    };
    getUser();
  }, []);

  // 👇 This is the function that actually delivers messages
  const handleSend = async (message) => {
    if (!user) return;

    const { data, error } = await supabase.from("messages").insert([
      {
        sender_id: user.id,
        receiver_id: "fd7f5c0a-2c2a-4cb9-88f1-520391c847c", // change this later to dynamic
        content: message,
      },
    ]);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      console.log("Message sent:", data);
    }
  };

  if (!user) return <div>Loading...</div>;

  return <Chat currentUserId={user.id} onSend={handleSend} />;
}
