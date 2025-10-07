import { useState } from "react";

export default function ChatMessageInput({ onSend }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); // ✅ prevent page reload
    if (!message.trim()) return; // avoid sending empty messages
    onSend(message); // send message to parent
    setMessage(""); // clear input after sending
  };

  return (
    <form onSubmit={handleSubmit} className="flex p-2 border-t">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 border rounded p-2"
      />
      <button
        type="submit"
        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Send
      </button>
    </form>
  );
}
