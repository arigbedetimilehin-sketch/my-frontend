import ChatMessageInput from "../components/Chat/ChatMessageInput";

export default function TestChat() {
  return (
    <div className="max-w-md mx-auto mt-10 shadow-lg border rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-3">💬 EchoSignal Test Chat</h1>
      <ChatMessageInput
        sender={{ id: "user1" }}
        receiver={{ id: "user2" }}
        onMessageSent={(msg) => console.log("✅ Message sent callback:", msg)}
      />
    </div>
  );
}
