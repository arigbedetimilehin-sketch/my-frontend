import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [search, setSearch] = useState("");
  const [userList, setUserList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // ✅ Load current user
  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("Auth error:", error);
      if (data?.user) setUser(data.user);
    }
    loadUser();
  }, []);

  // ✅ Search for other users
  useEffect(() => {
    if (search.trim().length === 0) {
      setUserList([]);
      return;
    }

    const loadUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, username")
        .ilike("email", `%${search}%`);

      if (error) console.error("Search error:", error);
      else setUserList(data.filter((u) => u.id !== user?.id));
    };

    loadUsers();
  }, [search]);

  // ✅ Load messages once recipient is set
  useEffect(() => {
    if (!user?.id || !recipient?.id) return;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, recipient_id, content, created_at")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},recipient_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) console.error("Load error:", error);
      else setMessages(data);
    }

    loadMessages();

    // 🔄 Realtime updates
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === user.id && msg.recipient_id === recipient.id) ||
            (msg.sender_id === recipient.id && msg.recipient_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, recipient]);

  // ✅ Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !recipient?.id) return;

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: user.id,
        recipient_id: recipient.id,
        content: newMessage.trim(),
      },
    ]);

    if (error) console.error("Send error:", error);
    else setNewMessage("");
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-lg shadow text-black">
      {!recipient ? (
        <>
          <h2 className="font-semibold text-xl mb-3">Search for a user</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter email or username"
            className="w-full p-2 border rounded mb-4"
          />

          {userList.length === 0 && search.length > 0 && (
            <p className="text-gray-500 text-center">No users found</p>
          )}

          <ul>
            {userList.map((u) => (
              <li
                key={u.id}
                className="p-2 border-b cursor-pointer hover:bg-gray-100 rounded"
                onClick={() => setRecipient(u)}
              >
                {u.username || u.email}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h2 className="font-semibold text-xl mb-3">
            Chat with {recipient.username || recipient.email}
          </h2>
          <div className="h-96 overflow-y-auto border p-3 mb-3 rounded">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet.</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 my-1 rounded-lg ${
                    msg.sender_id === user.id
                      ? "bg-blue-600 text-white text-right"
                      : "bg-gray-200 text-black text-left"
                  }`}
                >
                  {msg.content}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border p-2 rounded"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 transition"
            >
              Send
            </button>
          </div>

          <button
            onClick={() => setRecipient(null)}
            className="mt-4 text-sm text-blue-500 hover:underline"
          >
            🔙 Back to user search
          </button>
        </>
      )}
    </div>
  );
}
