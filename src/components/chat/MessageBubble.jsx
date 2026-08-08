import { formatRelative, getInitials } from '../../utils/helpers';

export default function MessageBubble({ message, isOwn = false }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] ${isOwn ? 'order-1' : 'order-2'}`}>
        <div className={`px-4 py-2.5 rounded-2xl ${
          isOwn
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-bl-md'
        }`}>
          {!isOwn && message.sender?.name && (
            <p className="text-xs font-semibold mb-1 opacity-70">{message.sender.name}</p>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        </div>
        <p className={`text-[10px] text-surface-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {formatRelative(message.createdAt || message.timestamp)}
        </p>
      </div>
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 order-1">
          {getInitials(message.sender?.name || '?')}
        </div>
      )}
    </div>
  );
}
