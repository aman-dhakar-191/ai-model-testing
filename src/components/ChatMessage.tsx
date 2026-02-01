import { Bot, User, Wrench, Brain } from 'lucide-react';
import type { Message } from '../types';
import ToolCallMessage from './ToolCallMessage';
import ThinkingBlock from './ThinkingBlock';
import InstructionsUsed from './InstructionsUsed';
import { parseThinking } from '../utils/thinking';

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

  // For streaming messages, use getStreamingThinking to handle unclosed <think> tags
  // For completed messages, use parseThinking for closed tags only
  let thinking = '';
  let response = message.content;
  
  if (!isUser && message.content) {
    if (message.isStreaming) {
      // During streaming, handle unclosed <think> blocks
      const streamingParsed = message.content.includes('<think>')
        ? (() => {
            const lastOpen = message.content.lastIndexOf('<think>');
            const lastClose = message.content.lastIndexOf('</think>');
            
            if (lastOpen > lastClose) {
              // Unclosed thinking block
              const beforeThink = message.content.substring(0, lastOpen).replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
              const thinkContent = message.content.substring(lastOpen + 7).trim();
              return { thinking: thinkContent, response: beforeThink };
            } else {
              // All closed, parse normally
              return parseThinking(message.content);
            }
          })()
        : { thinking: '', response: message.content };
      
      thinking = streamingParsed.thinking;
      response = streamingParsed.response;
    } else {
      // Completed message, parse normally
      const parsed = parseThinking(message.content);
      thinking = parsed.thinking;
      response = parsed.response;
    }
  }

  const hasThinking = thinking.length > 0;
  const hasInstructions = !isUser && message.instructionsUsed && message.instructionsUsed.length > 0;

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
          {message.isStreaming && (
            <span className="message-model streaming-badge">streaming...</span>
          )}
          {hasThinking && (
            <span className="message-badge thinking-badge">
              <Brain size={11} /> Thought
            </span>
          )}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <span className="message-badge tool-badge">
              <Wrench size={11} /> Tool Call
            </span>
          )}
          <span className="message-time">{time}</span>
        </div>
        {hasInstructions && (
          <InstructionsUsed instructions={message.instructionsUsed!} />
        )}
        {hasThinking && <ThinkingBlock content={thinking} isStreaming={message.isStreaming} />}
        {response && (
          <div className="message-content">
            {response}
            {message.isStreaming && <span className="streaming-cursor" />}
          </div>
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
