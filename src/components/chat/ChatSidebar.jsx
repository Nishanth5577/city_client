import { getInitials, formatRelative } from '../../utils/helpers';
import { Search, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function ChatSidebar({ conversations = [], selectedUser, onSelectUser, loading = false }) {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-surface-200 dark:border-surface-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text" placeholder="Search conversations..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm py-2"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((conv) => (
          <button
            key={conv._id}
            onClick={() => onSelectUser(conv)}
            className={`w-full flex items-center gap-3 p-3 text-left hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors border-b border-surface-100 dark:border-surface-800 ${
              selectedUser?._id === conv._id ? 'bg-primary-50 dark:bg-primary-900/10' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(conv.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{conv.name}</p>
              {conv.lastMessage && (
                <p className="text-xs text-surface-400 truncate">{conv.lastMessage}</p>
              )}
            </div>
            {conv.lastMessageTime && (
              <span className="text-[10px] text-surface-400 flex-shrink-0">{formatRelative(conv.lastMessageTime)}</span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-surface-400">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">{loading ? 'Loading...' : 'No conversations'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
