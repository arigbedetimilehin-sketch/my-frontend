import { useState } from "react";
import ChatMessageInput from "./ChatMessageInput";
import MessageList from "./MessageList";
import UserSelect from "./UserSelect";
import useDirectChat from "./useChat";

export default function Chat({ user }) {
  const [receiver, setReceiver] = useState(null);
  const { messages, sendMessage } = useDirectChat(user, receiver?.id);

  if (!user) {
    return <p className="text-center text-gray-600 mt-4">Please log in to chat.</p>;
  }

  return (
    <div className="max-w-lg mx-auto mt-6 bg-white shadow-md rounded-2xl p-4">
      <h2 className="text-2xl font-semibold text-center mb-4 text-indigo-700">
        Direct Messages
      </h2>

      {!receiver ? (
        <>
          <p className="text-center text-gray-500 mb-2">Select a user to start chatting:</p>
          <UserSelect onSelect={setReceiver} currentUser={user} />
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-3 border-b pb-2">
            <h3 className="text-lg font-medium text-gray-800">
              Chatting with: <span className="text-indigo-600">{receiver.email}</span>
            </h3>
            <button
              onClick={() => setReceiver(null)}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              ← Change User
            </button>
          </div>

          <div className="border rounded-xl h-80 overflow-y-auto mb-4 p-2 bg-gray-50">
            <MessageList messages={messages} currentUser={user} />
          </div>

          <ChatMessageInput
            onSend={(msg) => sendMessage(msg)}
            disabled={!receiver}
          />
        </>
      )}
    </div>
  );
}
