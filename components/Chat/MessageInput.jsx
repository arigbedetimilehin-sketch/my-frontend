import React, { useEffect } from "react";
import { decryptWithKey } from "../../utils/crypto";
import useDirectChat from "./useChat";

export default function MessageList({ user, otherUser, sharedKey }) {
  const { messages, markMessagesAsRead } = useDirectChat(user, otherUser?.id);

  useEffect(() => {
    if (user?.id && otherUser?.id) {
      markMessagesAsRead();
    }
  }, [user?.id, otherUser?.id]);

  // 🧩 Helper: decrypt or fallback to plaintext
  const getMessageText = async (msg) => {
    if (msg.is_encrypted && msg.content_encrypted && sharedKey) {
      try {
        const decrypted = await decryptWithKey(sharedKey, msg.content_encrypted, msg.iv);
        return decrypted;
      } catch (err) {
        console.error("❌ Failed to decrypt:", err);
        return "[Encrypted message]";
      }
    }
    return msg.content_text || msg.content || "[No content]";
  };

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] p-2">
      {messages.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No messages yet...</div>
      ) : (
        messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.sender_id === user.id}
            getMessageText={getMessageText}
          />
        ))
      )}
    </div>
  );
}

function MessageBubble({ msg, isOwn, getMessageText }) {
  const [text, setText] = React.useState("");

  useEffect(() => {
    (async () => {
      const t = await getMessageText(msg);
      setText(t);
    })();
  }, [msg]);

  return (
    <div
      className={`flex ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`px-4 py-2 rounded-2xl shadow text-sm max-w-[70%] break-words ${
          isOwn
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        <div>{text}</div>
        <div className="text-[10px] opacity-70 mt-1 text-right">
          {new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
