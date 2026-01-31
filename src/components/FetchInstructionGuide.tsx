import { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

const SYSTEM_PROMPT_SNIPPET = `Before starting any code generation task:
1. Call list_instructions to see available guides
2. Fetch all guides relevant to the current request
3. Apply the standards from the fetched guides in your code
4. If no guides are relevant, proceed without fetching`;

export default function FetchInstructionGuide() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySnippet = () => {
    navigator.clipboard.writeText(SYSTEM_PROMPT_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-guide">
      <button className="tool-guide-toggle" onClick={() => setOpen(!open)}>
        <FileText size={14} />
        <span>Instruction Guides</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div className="tool-guide-content">
          <section>
            <h5>What are Instruction Guides?</h5>
            <p>
              Instruction guides are <strong>markdown documents</strong> stored in the GitHub repository
              that contain coding standards, best practices, and project-specific rules. The AI can
              dynamically fetch and apply these guides before generating code.
            </p>
          </section>

          <section>
            <h5>Built-in Tools</h5>
            <p>Two tools are always available (no setup needed):</p>
            <ul>
              <li>
                <code>list_instructions</code> — Lists all available guides from the repository
              </li>
              <li>
                <code>fetch_instruction</code> — Fetches the full content of a specific guide by ID
              </li>
            </ul>
          </section>

          <section>
            <h5>How it Works</h5>
            <ol>
              <li>You send a request (e.g. "Create an Apex trigger")</li>
              <li>The AI calls <code>list_instructions</code> to discover available guides</li>
              <li>The AI decides which guides are relevant and fetches them</li>
              <li>The AI reads the guide content and applies the standards in its response</li>
              <li>An <strong>"Instructions Used"</strong> block appears at the top of the response showing which guides were loaded</li>
            </ol>
          </section>

          <section>
            <h5>Available Guides</h5>
            <ul>
              <li><strong>Apex Best Practices</strong> — Governor limits, trigger framework, security</li>
              <li><strong>PMD Rules</strong> — Static analysis rules and clean code standards</li>
              <li><strong>LWC Standards</strong> — Lightning Web Components best practices</li>
              <li><strong>Project Structure</strong> — Repository layout and naming conventions</li>
              <li><strong>Fetch Instruction Guide</strong> — Documentation for this tool system</li>
            </ul>
          </section>

          <section>
            <h5>Adding New Guides</h5>
            <ol>
              <li>Create a <code>.md</code> file in <code>instruction-guides/</code> in the repo</li>
              <li>Add an entry to <code>instruction-guides/index.json</code> with <code>id</code>, <code>filename</code>, <code>title</code>, and <code>description</code></li>
              <li>Push to <code>main</code> branch — the tool fetches from GitHub raw content</li>
            </ol>
          </section>

          <section>
            <h5>System Prompt Tip</h5>
            <p>Add this to your System Prompt so the AI always checks for relevant guides:</p>
            <div className="thinking-prompt-card">
              <div className="thinking-prompt-header">
                <span className="thinking-prompt-label">Auto-fetch Instructions</span>
                <button
                  className="tool-small-btn"
                  onClick={copySnippet}
                  title="Copy to clipboard"
                >
                  {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <pre className="guide-code">{SYSTEM_PROMPT_SNIPPET}</pre>
            </div>
          </section>

          <section>
            <h5>Tips</h5>
            <ul>
              <li>Guides are <strong>cached in memory</strong> during a session — repeated fetches are instant</li>
              <li>The AI only fetches guides it deems relevant, not all guides for every request</li>
              <li>These tools work alongside any custom tools you define</li>
              <li>The "Instructions Used" block is <strong>collapsible</strong> — click to expand and see guide IDs</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
