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
              Tool calling (function calling) lets AI models request external actions during a
              conversation. Instead of just generating text, the model can invoke defined functions
              with structured arguments, receive results, and use them in its response.
            </p>
          </section>

          <section>
            <h5>How it Works Here</h5>
            <ol>
              <li>Define tools in the <strong>Tools</strong> section of the settings panel</li>
              <li>Send a message that might need a tool (e.g. "What's the weather in Tokyo?")</li>
              <li>If the model decides to use a tool, the call is shown in the chat</li>
              <li>A <strong>mock result</strong> is automatically generated (no real execution)</li>
              <li>The mock result is fed back to the model to produce a final answer</li>
            </ol>
          </section>

          <section>
            <h5>Tool Schema Format</h5>
            <p>Each tool needs:</p>
            <ul>
              <li><strong>Name</strong> — Function identifier (e.g. <code>get_weather</code>)</li>
              <li><strong>Description</strong> — What the function does</li>
              <li><strong>Parameters</strong> — Named inputs with type and description</li>
              <li><strong>Required</strong> — Which parameters are mandatory</li>
            </ul>
          </section>

          <section>
            <h5>JSON Schema Example</h5>
            <pre className="guide-code">{`{
  "name": "get_weather",
  "description": "Get current weather for a location",
  "parameters": {
    "location": {
      "type": "string",
      "description": "City name"
    },
    "unit": {
      "type": "string",
      "description": "Temperature unit",
      "enum": ["celsius", "fahrenheit"]
    }
  },
  "required": ["location"]
}`}</pre>
          </section>

          <section>
            <h5>Tool Usage Best Practices</h5>
            <ul>
              <li><strong>Before creating files:</strong> Use <code>list_files</code> to check if file already exists</li>
              <li><strong>Before editing files:</strong> Use <code>read_file</code> to understand current content</li>
              <li><strong>Before creating components:</strong> Use <code>list_files</code> to check existing components and avoid duplicates</li>
              <li><strong>Directory structure:</strong> Always use proper Salesforce paths like <code>force-app/main/default/classes</code></li>
              <li><strong>Validation before deployment:</strong> Use <code>sf_validate_deploy</code> before <code>sf_deploy_metadata</code></li>
              <li><strong>Sequential operations:</strong> List → Read → Create/Edit → Validate → Deploy</li>
            </ul>
          </section>

          <section>
            <h5>Tips</h5>
            <ul>
              <li>Use <strong>Presets</strong> to quickly load example tools</li>
              <li>You can also <strong>Edit as JSON</strong> for full control over the schema</li>
              <li>All tool results are <strong>mocked</strong> — no real APIs are called</li>
              <li>Not all models support tool calling — larger models work best</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
