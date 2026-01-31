import { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import type { ToolCall } from '../types';

interface ToolCallMessageProps {
  toolCalls: ToolCall[];
  toolResults: Map<string, { name: string; result: string }>;
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function SingleToolCall({
  call,
  result,
}: {
  call: ToolCall;
  result?: { name: string; result: string };
}) {
  const [expanded, setExpanded] = useState(false); // Collapsed by default

  // For fetch_instruction, extract and show summary instead of full content
  const isFetchInstruction = call.function.name === 'fetch_instruction';
  let displayResult = result?.result;
  let instructionTitle = '';

  if (isFetchInstruction && result?.result) {
    try {
      const parsed = JSON.parse(result.result);
      if (parsed.title) {
        instructionTitle = parsed.title;
        // Create a summary message instead of full content
        displayResult = JSON.stringify({
          status: 'success',
          instruction: parsed.title,
          guide_id: parsed.guide_id,
          message: `Fetched instruction guide: ${parsed.title}`,
        }, null, 2);
      }
    } catch {
      // If parsing fails, keep original result
    }
  }

  return (
    <div className="tool-call-block">
      <div className="tool-call-header" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Wrench size={14} />
        <span className="tool-call-fn">
          {call.function.name}
          {isFetchInstruction && instructionTitle && (
            <span className="tool-call-instruction-title"> - {instructionTitle}</span>
          )}
        </span>
        {result && <CheckCircle size={14} className="tool-call-done" />}
      </div>
      {expanded && (
        <div className="tool-call-body">
          <div className="tool-call-section">
            <span className="tool-call-label">Arguments</span>
            <pre className="tool-call-code">{formatJson(call.function.arguments)}</pre>
          </div>
          {result && (
            <div className="tool-call-section">
              <span className="tool-call-label">Result</span>
              <pre className="tool-call-code tool-call-result">{formatJson(displayResult)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ToolCallMessage({ toolCalls, toolResults }: ToolCallMessageProps) {
  return (
    <div className="tool-calls-container">
      {toolCalls.map((call) => (
        <SingleToolCall
          key={call.id}
          call={call}
          result={toolResults.get(call.id)}
        />
      ))}
    </div>
  );
}
