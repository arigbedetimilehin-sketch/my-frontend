import Chat from "../components/chat/chat";
import MessageList from "../components/chat/MessageList";
import ChatMessageInput from "../components/chat/ChatMessageInput";

export default function TestChat() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">🧪 Chat Component Test</h1>
      <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-lg shadow-lg w-full max-w-2xl">
        <MessageList />
        <ChatMessageInput />
        <Chat />
      </div>
    </div>
  );
}
