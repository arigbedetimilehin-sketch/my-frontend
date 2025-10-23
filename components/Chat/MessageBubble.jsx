// components/MessageBubble.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function MessageBubble({ message, currentUserId }) {
  const mine = message.sender_id === currentUserId;
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <motion.div
        className={`${mine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} max-w-[75%] p-3 rounded-lg`}
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="text-sm whitespace-pre-wrap">{message.content_resolved ?? message.content_text ?? message.content}</div>
        <div className="text-xs text-gray-400 mt-1 text-right">{new Date(message.created_at).toLocaleTimeString()}</div>
      </motion.div>
    </div>
  );
}
