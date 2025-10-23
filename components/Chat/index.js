import { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";

// 🔒 AES Encryption/Decryption Helpers
async function generateKey(sharedKey) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(sharedKey.padEnd(32, "0"));
  return await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

async function encryptWithKey(sharedKey, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await generateKey(sharedKey);
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const buffer = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + buffer.length);
  combined.set(iv);
  combined.set(buffer, iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptWithKey(sharedKey, encryptedText) {
  try {
    const data = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const key = await generateKey(sharedKey);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("❌ Decrypt error:", e);
    return "[Encrypted message]";
  }
}

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [emailSearch, setEmailSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const sharedKey = "WhiteLotusSharedKey";
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // 🧠 Fetch current logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("❌ Failed to get user:", error);
      else setUser(data.user);
    };
    fetchUser();
  }, []);

  // 🔍 Search for user by email
  const searchUserByEmail = async () => {
    if (!emailSearch.trim()) return;
    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", emailSearch.trim())
      .single();

    if (error || !data) {
      alert("User not found!");
      console.error("❌ Error searching user:", error);
    } else {
      setReceiver(data);
    }
    setSearching(false);
  };

  // 📩 Load and decrypt messages
  const loadMessages = async () => {
    if (!user?.id || !receiver?.id) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${receiver.id}),
         and(sender_id.eq.${receiver.id},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Load messages error:", error);
      return;
    }

    const decrypted = await Promise.all(
      data.map(async (msg) => ({
        ...msg,
        content: await decryptWithKey(sharedKey, msg.content),
      }))
    );

    setMessages(decrypted);
    scrollToBottom();
  };

  // ⚡ Real-time message updates
  useEffect(() => {
    if (!user?.id || !receiver?.id) return;

    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === user.id && msg.recipient_id === receiver.id) ||
            (msg.sender_id === receiver.id && msg.recipient_id === user.id)
          ) {
            msg.content = await decryptWithKey(sharedKey, msg.content);
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, receiver?.id]);

  // 📨 Send encrypted message
  const sendMessage = async () => {
    if (!text.trim() || !user?.id || !receiver?.id) return;
    setSending(true);

    const encryptedContent = await encryptWithKey(sharedKey, text.trim());
    const { error } = await supabase.from("messages").insert([
      {
        sender_id: user.id,
        recipient_id: receiver.id,
        content: encryptedContent,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("❌ Send message error:", error);
    } else {
      setText("");
      scrollToBottom();
    }

    setSending(false);
  };

  // 🔁 Reload messages when receiver changes
  useEffect(() => {
    if (receiver) loadMessages();
  }, [receiver]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white p-4 rounded-2xl shadow-lg">
        {/* 🔍 Search Section */}
        {!receiver ? (
          <div className="flex flex-col items-center space-y-3">
            <h2 className="text-lg font-bold text-gray-800">🔍 Find a User to Chat</h2>
            <input
              type="email"
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              placeholder="Enter user email"
              className="border rounded-lg w-full p-2 text-black focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={searchUserByEmail}
              disabled={searching}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>
        ) : (
          <>
            {/* 🧩 Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Chat with {receiver.email}</h3>
              <button
                onClick={() => setReceiver(null)}
                className="text-sm text-red-600 hover:underline"
              >
                Change User
              </button>
            </div>

            {/* 💬 Messages */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50 border rounded-lg h-80">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center mt-4">No messages yet.</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`my-1 p-2 rounded-lg max-w-[75%] break-words ${
                      msg.sender_id === user?.id
                        ? "bg-blue-600 text-white ml-auto"
                        : "bg-gray-300 text-black mr-auto"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ✉️ Input Box */}
            <div className="mt-3 flex">
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 border rounded-l-lg p-2 text-black focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={sending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg transition disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
