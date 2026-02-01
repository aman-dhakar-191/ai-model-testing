import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';

export default function ToolGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="tool-guide">
      <button className="tool-guide-toggle" onClick={() => setOpen(!open)}>
        <BookOpen size={14} />
        <span>Tool Calling Guide</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div className="tool-guide-content">
          <section>
            <h5>What are Tool Calls?</h5>
            <p>
              Tool calling lets AI models execute actions during conversations. The model writes
              XML tool calls in its response content, and the system automatically parses and
              executes them.
            </p>
          </section>

          <section>
            <h5>How it Works Here</h5>
            <ol>
              <li>The AI writes a <code>&lt;tool_call&gt;</code> XML block in its response</li>
              <li>The system detects and extracts the tool call</li>
              <li>The tool is executed automatically with the provided arguments</li>
              <li>The result is sent back to the AI</li>
              <li>The AI continues its response with the result</li>
            </ol>
          </section>

          <section>
            <h5>XML Tool Call Format</h5>
            <p>The AI writes tool calls using this XML structure:</p>
            <pre className="guide-code">{`<tool_call>
<tool_name>list_files</tool_name>
<arguments>
{
  "path": "force-app/main/default/classes"
}
</arguments>
</tool_call>`}</pre>
            <ul>
              <li><strong>&lt;tool_name&gt;</strong> — The function to call</li>
              <li><strong>&lt;arguments&gt;</strong> — JSON object with parameters</li>
            </ul>
          </section>

          <section>
            <h5>Example: Creating an Apex Class</h5>
            <pre className="guide-code">{`<tool_call>
<tool_name>create_apex_class</tool_name>
<arguments>
{
  "className": "AccountTriggerHandler",
  "content": "public class AccountTriggerHandler {\\n  // handler code\\n}"
}
</arguments>
</tool_call>`}</pre>
          </section>

          <section>
            <h5>Tool Usage Best Practices</h5>
            <ul>
              <li><strong>Check before creating:</strong> Use <code>list_files</code> to verify files don't exist</li>
              <li><strong>Read before editing:</strong> Use <code>read_file</code> to understand current content</li>
              <li><strong>Proper paths:</strong> Always use full Salesforce paths like <code>force-app/main/default/classes</code></li>
              <li><strong>Sequential flow:</strong> List → Read → Create/Edit → Validate → Deploy</li>
              <li><strong>Wait for results:</strong> The AI automatically waits for each tool to complete</li>
            </ul>
          </section>

          <section>
            <h5>Available Tools</h5>
            <ul>
              <li><code>list_files</code> — Browse project directories</li>
              <li><code>read_file</code> — Read file contents</li>
              <li><code>create_apex_class</code> — Create Apex classes/triggers</li>
              <li><code>create_lwc_component</code> — Create Lightning Web Components</li>
              <li><code>edit_file</code> — Modify existing files</li>
              <li><code>sf_validate_deploy</code> — Validate deployment</li>
              <li><code>sf_deploy_metadata</code> — Deploy to org</li>
              <li><code>update_todo_list</code> — Track tasks</li>
            </ul>
          </section>

          <section>
            <h5>Tips</h5>
            <ul>
              <li>Tool calls are written in the <strong>response content</strong>, not in thinking blocks</li>
              <li>The XML is <strong>automatically hidden</strong> from the UI display</li>
              <li>Tool results appear as <strong>collapsed blocks</strong> in the chat</li>
              <li>The AI can make <strong>multiple sequential tool calls</strong></li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
