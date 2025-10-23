// pages/dashboard.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import ChatWindow from "../components/Chat/ChatWindow";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("❌ Auth error:", error);
      else setUser(data?.user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email")
        .neq("id", user.id);
      if (error) console.error("❌ Profiles fetch error:", error);
      else setProfiles(data || []);
    };
    fetchProfiles();
  }, [user]);

  useEffect(() => {
    if (!user) setOtherUser(null);
  }, [user]);

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Loading user info...</div>;
  }

  if (!otherUser) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4">Select a user to chat with</h2>
        {profiles.length === 0 && <p className="text-gray-500">No other users found.</p>}
        <ul>
          {profiles.map((p) => (
            <li key={p.id} className="mb-2">
              <button
                onClick={() => setOtherUser(p)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {p.email}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto border border-gray-300 rounded-lg shadow">
      <div className="p-4 border-b bg-gray-100 font-semibold flex justify-between items-center">
        <span>Chat with {otherUser.email}</span>
        <button
          onClick={() => setOtherUser(null)}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          ← Change User
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ChatWindow
          senderId={user.id}
          recipientId={otherUser.id}
          sharedKey="your_shared_key_here"
        />
      </div>
    </div>
  );
}
