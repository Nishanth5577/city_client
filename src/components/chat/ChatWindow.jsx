import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { Send } from 'lucide-react';

export default function ChatWindow({ messages = [], currentUserId, selectedUser, newMsg, setNewMsg, onSend }) {
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-surface-400">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold">
          {selectedUser.name?.charAt(0) || '?'}
        </div>
        <div>
          <p className="font-medium text-surface-900 dark:text-white text-sm">{selectedUser.name}</p>
          <p className="text-xs text-surface-400">{selectedUser.role?.replace('_', ' ') || 'Team member'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg._id || i}
            message={msg}
            isOwn={(msg.sender?._id || msg.sender) === currentUserId}
          />
        ))}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <form onSubmit={onSend} className="p-3 border-t border-surface-200 dark:border-surface-700 flex gap-2">
        <input
          type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message..." className="input-field flex-1 text-sm py-2"
        />
        <button type="submit" disabled={!newMsg.trim()} className="btn-primary p-2.5 rounded-xl">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
