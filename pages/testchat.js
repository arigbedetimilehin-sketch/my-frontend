import { supabase } from '../supabaseClient';
import MessageList from '../components/chat/MessageList';
import ChatMessageInput from '../components/chat/ChatMessageInput';

export default function TestChat() {
  const senderId = "be14f71d-ef85-40ea-8eaa-ce2b996e2842";
  const recipientId = "0af6a5b3-fde3-4612-a7dd-b77526bba9cd";

  const handleSendMessage = async (content) => {
    const { error } = await supabase.from("messages").insert([
      {
        sender_id: senderId,
        receiver_id: recipientId,
        content,
      },
    ]);

    if (error) {
      console.error("Send error:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 shadow-lg border rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-3">💬 EchoSignal Test Chat</h1>

      <MessageList senderId={senderId} recipientId={recipientId} />

      <ChatMessageInput
        senderId={senderId}
        recipientId={recipientId}
        onSend={handleSendMessage}
      />
    </div>
  );
}
