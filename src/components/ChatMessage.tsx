import { Bot, User, Wrench } from 'lucide-react';
import type { Message } from '../types';
import ToolCallMessage from './ToolCallMessage';

interface ChatMessageProps {
  message: Message;
  toolResults?: Map<string, { name: string; result: string }>;
}

export default function ChatMessage({ message, toolResults }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isTool) return null;

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div className="message-body">
        <div className="message-header">
          <span className="message-role">{isUser ? 'You' : 'Assistant'}</span>
          {message.model && !isUser && (
            <span className="message-model">{message.model}</span>
          )}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <span className="message-badge tool-badge">
              <Wrench size={11} /> Tool Call
            </span>
          )}
          <span className="message-time">{time}</span>
        </div>
        {message.content && (
          <div className="message-content">{message.content}</div>
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCallMessage
            toolCalls={message.toolCalls}
            toolResults={toolResults ?? new Map()}
          />
        )}
      </div>
    </div>
  );
}
