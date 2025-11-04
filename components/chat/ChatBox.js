import { useEffect } from "react";
import useDirectChat from "./useChat";

export default function ChatBox({ sender, receiver }) {
  const { messages, sendMessage, markMessagesAsRead } = useDirectChat(sender, receiver.id);

  useEffect(() => {
    // ✅ When receiver opens this chat, mark messages as read
    markMessagesAsRead();
  }, [receiver.id]);

  return (
    <div className="p-4 space-y-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`p-2 rounded-lg ${
            msg.sender_id === sender.id ? "bg-blue-500 text-white self-end" : "bg-gray-200"
          }`}
        >
          <p>{msg.content}</p>
          {msg.sender_id === sender.id ? (
            <small className="text-xs">
              {msg.is_read ? "✅ Read" : "🕓 Sent"}
            </small>
          ) : null}
        </div>
      ))}
    </div>
  );
}
