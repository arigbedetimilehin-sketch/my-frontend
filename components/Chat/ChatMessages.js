import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";

// 🧩 AES Encryption / Decryption Helpers
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
    console.error("❌ Failed to decrypt message:", e);
    return "[Encrypted message]";
  }
}

export default function ChatMessages({ user, recipient, sharedKey }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Load messages
  const loadMessages = async () => {
    if (!user?.id || !recipient?.id) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},recipient_id.eq.${user.id})`
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

  useEffect(() => {
    loadMessages();
  }, [user?.id, recipient?.id, sharedKey]);

  // Real-time live updates
  useEffect(() => {
    if (!user?.id || !recipient?.id) return;

    const channel = supabase
      .channel("encrypted-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === user.id && msg.recipient_id === recipient.id) ||
            (msg.sender_id === recipient.id && msg.recipient_id === user.id)
          ) {
            msg.content = await decryptWithKey(sharedKey, msg.content);
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, recipient?.id, sharedKey]);

  // Send encrypted message
  const sendMessage = async () => {
    if (!text.trim()) return;
    if (!user?.id || !recipient?.id) {
      console.error("❌ Sender or recipient not set", { user, recipient });
      return;
    }

    setSending(true);

    const encryptedContent = await encryptWithKey(sharedKey, text.trim());

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: user.id,
        recipient_id: recipient.id,
        content: encryptedContent,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) console.error("❌ Failed to send message:", error);
    else setText("");

    setSending(false);
    scrollToBottom();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 bg-white border rounded-lg shadow-sm">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-4">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`my-1 p-2 rounded-lg max-w-[75%] break-words ${
                msg.sender_id === user.id
                  ? "bg-blue-600 text-white ml-auto"
                  : "bg-gray-200 text-black mr-auto"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
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
          {sending ? "Encrypting..." : "Send"}
        </button>
      </div>
    </div>
  );
}
