import { useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

const THINKING_PROMPTS = [
  {
    label: 'Basic Thinking',
    prompt: 'Think step by step. Show your reasoning inside <think>...</think> tags before giving your final answer.',
  },
  {
    label: 'Detailed Reasoning',
    prompt: `Before answering, carefully reason through the problem inside <think>...</think> tags. Break down your thought process into clear steps. Consider edge cases and alternative approaches. Only after thorough analysis, provide your final answer outside the think tags.`,
  },
  {
    label: 'Chain of Thought',
    prompt: `You must always think before responding. Wrap all internal reasoning in <think>...</think> tags. In your thinking, break the problem into parts, analyze each part, and verify your conclusions. Your visible response should be concise and well-structured.`,
  },
];

export default function ThinkingGuide() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const copyPrompt = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="tool-guide">
      <button className="tool-guide-toggle" onClick={() => setOpen(!open)}>
        <Brain size={14} />
        <span>Thinking Mode Guide</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div className="tool-guide-content">
          <section>
            <h5>What is Thinking Mode?</h5>
            <p>
              Some models (DeepSeek R1, Chimera, etc.) natively output their reasoning
              inside <code>&lt;think&gt;...&lt;/think&gt;</code> tags. For models that
              don't do this automatically, you can <strong>enable thinking via a system prompt</strong> that
              instructs the model to wrap its reasoning in think tags.
            </p>
          </section>

          <section>
            <h5>How it Works</h5>
            <ol>
              <li>Add a thinking instruction to the <strong>System Prompt</strong> above</li>
              <li>The model will output reasoning inside <code>&lt;think&gt;</code> tags</li>
              <li>The UI automatically detects and displays thinking in a <strong>collapsible yellow block</strong></li>
              <li>The actual response appears below, clean and without the reasoning</li>
            </ol>
          </section>

          <section>
            <h5>System Prompt Templates</h5>
            <p>Copy one of these into your System Prompt to enable thinking:</p>
            <div className="thinking-prompts">
              {THINKING_PROMPTS.map((tp, i) => (
                <div key={i} className="thinking-prompt-card">
                  <div className="thinking-prompt-header">
                    <span className="thinking-prompt-label">{tp.label}</span>
                    <button
                      className="tool-small-btn"
                      onClick={() => copyPrompt(i, tp.prompt)}
                      title="Copy to clipboard"
                    >
                      {copied === i ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                  <pre className="guide-code">{tp.prompt}</pre>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h5>Native Thinking Models</h5>
            <p>These models output <code>&lt;think&gt;</code> blocks automatically — no system prompt needed:</p>
            <ul>
              <li><strong>DeepSeek R1 / R1 0528</strong> — native chain-of-thought</li>
              <li><strong>TNG Chimera variants</strong> — R1T, R1T2 Chimera</li>
              <li><strong>Qwen QwQ / Qwen3</strong> — built-in reasoning</li>
            </ul>
          </section>

          <section>
            <h5>Tips</h5>
            <ul>
              <li>Thinking blocks are <strong>collapsed by default</strong> in finished messages — click to expand</li>
              <li>During streaming, the thinking block <strong>auto-expands</strong> so you can watch reasoning live</li>
              <li>You can combine thinking instructions with tool calling — the model will reason before deciding which tool to use</li>
              <li>Longer thinking usually produces better answers but increases response time</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
