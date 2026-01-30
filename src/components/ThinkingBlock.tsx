import { useState } from 'react';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';

interface ThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
}

export default function ThinkingBlock({ content, isStreaming }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(!!isStreaming);

  if (!content) return null;

  return (
    <div className={`thinking-block ${isStreaming ? 'thinking-streaming' : ''}`}>
      <button className="thinking-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Brain size={14} />
        <span className="thinking-label">
          Thinking
          {isStreaming && <span className="thinking-pulse">...</span>}
        </span>
        {!expanded && (
          <span className="thinking-preview">
            {content.slice(0, 80)}{content.length > 80 ? '...' : ''}
          </span>
        )}
      </button>
      {expanded && (
        <div className="thinking-content">
          {content}
          {isStreaming && <span className="streaming-cursor" />}
        </div>
      )}
    </div>
  );
}
