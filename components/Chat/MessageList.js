export default function MessageList({ messages }) {
  if (!messages.length) {
    return <p>No messages yet.</p>;
  }

  return (
    <ul>
      {messages.map((msg) => (
        <li key={msg.id}>
          <strong>{msg.sender_id} → {msg.receiver_id}:</strong> {msg.content}{" "}
          <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
        </li>
      ))}
    </ul>
  );
}
