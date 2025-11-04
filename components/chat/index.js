import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function ChatComponent({ user, recipient }) {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (user && recipient) {
      loadMessages();
    }

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (
            payload.new.sender_id === user.id ||
            payload.new.recipient_id === user.id
          ) {
            setMessages(prev => {
              const updated = [...prev, payload.new];
              filterMessages(updated, searchTerm);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, recipient]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      setFilteredMessages(data);
    } else {
      console.error("Message load error:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const { error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: user.id,
          recipient_id: recipient.id,
          content: newMessage.trim()
        }
      ]);

    if (error) {
      console.error("Message send error:", error);
    }

    setNewMessage("");
  };

  const filterMessages = (msgs = messages, term = searchTerm) => {
    setFilteredMessages(
      msgs.filter(
        (msg) =>
          msg.content.toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  const handleSearch = () => {
    filterMessages();
  };

  return (
    <div className="flex flex-col h-[75vh] bg-gray-800 text-white p-4 rounded-xl">
      
      {/* SEARCH BAR */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-700"
        />
        <button
          onClick={handleSearch}
          className="px-4 bg-blue-600 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto bg-gray-900 p-3 rounded space-y-2">
        {filteredMessages.length === 0 ? (
          <p className="text-gray-400 text-center">No messages</p>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded-lg max-w-[70%] ${
                msg.sender_id === user.id
                  ? "bg-blue-600 ml-auto"
                  : "bg-gray-600"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
      </div>

      {/* INPUT */}
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-700"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 px-4 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
