import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { getSocket } from '../../services/socketService';
import { getInitials, formatRelative } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { MessageSquare, Send, Search, Users, ArrowLeft, Paperclip, Check, CheckCheck, Loader2 } from 'lucide-react';

export default function ChatPage() {
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEnd = useRef(null);
  const typingTimeout = useRef(null);

  // Load conversations and users
  useEffect(() => {
    const load = async () => {
      try {
        const [convRes, usersRes] = await Promise.all([
          api.get('/api/chat/conversations'),
          api.get('/api/chat/users'),
        ]);
        setConversations(convRes.data || []);
        setAllUsers(usersRes.data || []);
      } catch (err) {
        console.error('Failed to load chat data:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      api.get(`/api/chat/conversation/${selectedUser._id}`).then(r => {
        setMessages(r.data.messages || []);
      }).catch(() => setMessages([]));
    }
  }, [selectedUser]);

  // Scroll to bottom on new messages
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Socket listeners for real-time chat
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      // Add to current conversation if relevant
      if (senderId === selectedUser?._id || (msg.receiver?._id || msg.receiver) === selectedUser?._id) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      // Update conversations list
      setConversations(prev => {
        const partnerId = senderId === user?._id ? (msg.receiver?._id || msg.receiver) : senderId;
        const exists = prev.find(c => c.user?._id === partnerId);
        if (exists) {
          return prev.map(c => c.user?._id === partnerId
            ? { ...c, lastMessage: msg.message, lastMessageAt: msg.createdAt, unread: senderId !== user?._id ? (c.unread || 0) + 1 : c.unread }
            : c
          ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        }
        return prev;
      });
    };

    const handleTyping = ({ sender, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) return { ...prev, [sender]: true };
        const next = { ...prev };
        delete next[sender];
        return next;
      });
    };

    socket.on('chat_message', handleMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('chat_message', handleMessage);
      socket.off('typing', handleTyping);
    };
  }, [selectedUser, user]);

  // Send typing indicator
  const handleTypingNotify = useCallback(() => {
    const socket = getSocket();
    if (socket && selectedUser) {
      socket.emit('typing', { receiver: selectedUser._id, isTyping: true });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing', { receiver: selectedUser._id, isTyping: false });
      }, 2000);
    }
  }, [selectedUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedUser) return;
    setSendingMsg(true);
    try {
      const { data } = await api.post('/api/chat/message', { receiver: selectedUser._id, message: newMsg });
      setMessages(prev => [...prev, data]);
      setNewMsg('');
      // Update conversation list
      setConversations(prev => {
        const exists = prev.find(c => c.user?._id === selectedUser._id);
        if (exists) {
          return prev.map(c => c.user?._id === selectedUser._id
            ? { ...c, lastMessage: newMsg, lastMessageAt: new Date().toISOString() }
            : c
          );
        }
        return [{ user: selectedUser, lastMessage: newMsg, lastMessageAt: new Date().toISOString(), unread: 0 }, ...prev];
      });
      // Stop typing indicator
      const socket = getSocket();
      if (socket) socket.emit('typing', { receiver: selectedUser._id, isTyping: false });
    } catch (err) {
      toast.error('Failed to send message');
    }
    setSendingMsg(false);
  };

  const startConversation = (u) => {
    setSelectedUser(u);
    setShowUserList(false);
    setSearchQuery('');
  };

  // Filter users/conversations by search
  const filteredConversations = conversations.filter(c =>
    c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isTyping = selectedUser && typingUsers[selectedUser._id];

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Chat</h1><p className="text-surface-500 mt-1">Real-time team communication</p></div>

      <div className="glass-card overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        <div className="flex h-full">
          {/* Conversation List */}
          <div className="w-80 border-r border-surface-200 dark:border-surface-700 flex flex-col">
            <div className="p-3 border-b border-surface-200 dark:border-surface-700 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-9 py-2 text-sm w-full" />
              </div>
              <button onClick={() => setShowUserList(!showUserList)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" title="New conversation">
                <Users className="w-4 h-4 text-surface-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Show user list for new conversations */}
              {showUserList ? (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider bg-surface-50 dark:bg-surface-800/50">All Team Members</div>
                  {filteredUsers.map(u => (
                    <button key={u._id} onClick={() => startConversation(u)} className="w-full flex items-center gap-3 p-3 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{getInitials(u.name)}</div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm text-surface-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-xs text-surface-500 capitalize">{u.role?.replace('_', ' ')}</p>
                      </div>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && <p className="text-center text-surface-400 text-sm py-6">No users found</p>}
                </>
              ) : (
                <>
                  {filteredConversations.map(conv => (
                    <button key={conv.user?._id} onClick={() => setSelectedUser(conv.user)} className={`w-full flex items-center gap-3 p-3 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors ${selectedUser?._id === conv.user?._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{getInitials(conv.user?.name)}</div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-surface-900 dark:text-white truncate">{conv.user?.name}</p>
                          {conv.unread > 0 && <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">{conv.unread}</span>}
                        </div>
                        <p className="text-xs text-surface-500 truncate">{conv.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                  {filteredConversations.length === 0 && (
                    <div className="text-center py-8 px-4">
                      <p className="text-surface-400 text-sm mb-2">No conversations yet</p>
                      <button onClick={() => setShowUserList(true)} className="text-primary-500 text-sm font-medium hover:underline">Start a new conversation</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">{getInitials(selectedUser.name)}</div>
                  <div className="flex-1">
                    <p className="font-medium text-surface-900 dark:text-white">{selectedUser.name}</p>
                    <p className="text-xs text-surface-500 capitalize">
                      {isTyping ? <span className="text-primary-500">typing...</span> : selectedUser.role?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-surface-400 text-sm">
                      <p>Send a message to start the conversation</p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMe = (msg.sender?._id || msg.sender) === user?._id;
                    return (
                      <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-bl-sm'}`}>
                          <p>{msg.message}</p>
                          {msg.attachment?.url && (
                            <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 mt-1 text-xs ${isMe ? 'text-primary-200' : 'text-primary-500'}`}>
                              <Paperclip className="w-3 h-3" /> {msg.attachment.name || 'Attachment'}
                            </a>
                          )}
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                            <span className={`text-[10px] ${isMe ? 'text-primary-200' : 'text-surface-400'}`}>{formatRelative(msg.createdAt)}</span>
                            {isMe && (msg.read ? <CheckCheck className="w-3 h-3 text-primary-200" /> : <Check className="w-3 h-3 text-primary-300" />)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEnd} />
                </div>
                <form onSubmit={sendMessage} className="p-3 border-t border-surface-200 dark:border-surface-700 flex gap-2">
                  <input
                    type="text" value={newMsg}
                    onChange={(e) => { setNewMsg(e.target.value); handleTypingNotify(); }}
                    placeholder="Type a message..."
                    className="input-field flex-1"
                  />
                  <button type="submit" disabled={sendingMsg || !newMsg.trim()} className="btn-primary px-4 disabled:opacity-50">
                    {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-surface-400">
                <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Select a conversation</p>
                <p className="text-sm mb-4">or start a new one</p>
                <button onClick={() => setShowUserList(true)} className="btn-primary text-sm px-4 py-2">
                  <Users className="w-4 h-4 inline mr-2" /> New Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
