import { useState } from 'react';
import { Plus, Trash2, Wrench, ChevronDown, ChevronRight, Copy, RotateCcw, FileJson } from 'lucide-react';
import type { ToolDefinition, ToolParameter } from '../types';
import { PRESET_TOOLS } from '../utils/mockTools';

interface ToolEditorProps {
  tools: ToolDefinition[];
  onChange: (tools: ToolDefinition[]) => void;
}

function generateId() {
  return crypto.randomUUID();
}

function emptyTool(): ToolDefinition {
  return {
    id: generateId(),
    name: '',
    description: '',
    parameters: {},
    required: [],
  };
}

function ParamEditor({
  params,
  required,
  onChangeParams,
  onChangeRequired,
}: {
  params: Record<string, ToolParameter>;
  required: string[];
  onChangeParams: (p: Record<string, ToolParameter>) => void;
  onChangeRequired: (r: string[]) => void;
}) {
  const [newName, setNewName] = useState('');

  const addParam = () => {
    const name = newName.trim();
    if (!name || params[name]) return;
    onChangeParams({ ...params, [name]: { type: 'string', description: '' } });
    setNewName('');
  };

  const removeParam = (name: string) => {
    const next = { ...params };
    delete next[name];
    onChangeParams(next);
    onChangeRequired(required.filter((r) => r !== name));
  };

  const updateParam = (name: string, field: keyof ToolParameter, value: string) => {
    const updated = { ...params[name] };
    if (field === 'enum') {
      updated.enum = value ? value.split(',').map((s) => s.trim()) : undefined;
    } else if (field === 'type') {
      updated.type = value;
    } else if (field === 'description') {
      updated.description = value;
    }
    onChangeParams({ ...params, [name]: updated });
  };

  const toggleRequired = (name: string) => {
    if (required.includes(name)) {
      onChangeRequired(required.filter((r) => r !== name));
    } else {
      onChangeRequired([...required, name]);
    }
  };

  return (
    <div className="param-editor">
      <div className="param-list">
        {Object.entries(params).map(([name, param]) => (
          <div key={name} className="param-item">
            <div className="param-item-header">
              <code className="param-name">{name}</code>
              <select
                className="param-type-select"
                value={param.type}
                onChange={(e) => updateParam(name, 'type', e.target.value)}
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
                <option value="integer">integer</option>
              </select>
              <label className="param-required-label">
                <input
                  type="checkbox"
                  checked={required.includes(name)}
                  onChange={() => toggleRequired(name)}
                />
                required
              </label>
              <button className="param-remove-btn" onClick={() => removeParam(name)} title="Remove parameter">
                <Trash2 size={12} />
              </button>
            </div>
            <input
              className="param-desc-input"
              type="text"
              value={param.description}
              onChange={(e) => updateParam(name, 'description', e.target.value)}
              placeholder="Description..."
            />
            {param.type === 'string' && (
              <input
                className="param-desc-input"
                type="text"
                value={param.enum?.join(', ') ?? ''}
                onChange={(e) => updateParam(name, 'enum', e.target.value)}
                placeholder="Enum values (comma-separated, optional)"
              />
            )}
          </div>
        ))}
      </div>
      <div className="add-param-row">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addParam()}
          placeholder="Parameter name..."
          className="param-name-input"
        />
        <button className="add-param-btn" onClick={addParam} disabled={!newName.trim()}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

export default function ToolEditor({ tools, onChange }: ToolEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jsonMode, setJsonMode] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const addTool = () => {
    const tool = emptyTool();
    onChange([...tools, tool]);
    setExpandedId(tool.id);
  };

  const addPreset = (preset: ToolDefinition) => {
    if (tools.some((t) => t.name === preset.name)) return;
    const tool = { ...preset, id: generateId() };
    onChange([...tools, tool]);
  };

  const removeTool = (id: string) => {
    onChange(tools.filter((t) => t.id !== id));
    if (expandedId === id) setExpandedId(null);
    if (jsonMode === id) setJsonMode(null);
  };

  const updateTool = (id: string, updates: Partial<ToolDefinition>) => {
    onChange(tools.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setJsonMode(null);
  };

  const openJsonEditor = (tool: ToolDefinition) => {
    const { id, ...rest } = tool;
    void id;
    setJsonText(JSON.stringify(rest, null, 2));
    setJsonError(null);
    setJsonMode(tool.id);
  };

  const saveJson = (id: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      updateTool(id, {
        name: parsed.name ?? '',
        description: parsed.description ?? '',
        parameters: parsed.parameters ?? {},
        required: parsed.required ?? [],
      });
      setJsonMode(null);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const loadAllPresets = () => {
    const existing = new Set(tools.map((t) => t.name));
    const toAdd = PRESET_TOOLS.filter((p) => !existing.has(p.name)).map((p) => ({ ...p, id: generateId() }));
    onChange([...tools, ...toAdd]);
  };

  // Bulk JSON editor
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);

  const openBulkEditor = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const stripped = tools.map(({ id: _id, ...rest }) => rest);
    setBulkJson(JSON.stringify(stripped, null, 2));
    setBulkError(null);
    setBulkMode(true);
  };

  const saveBulkJson = () => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) {
        setBulkError('JSON must be an array of tool definitions.');
        return;
      }
      const imported: ToolDefinition[] = parsed.map((t: Record<string, unknown>) => ({
        id: generateId(),
        name: (t.name as string) ?? '',
        description: (t.description as string) ?? '',
        parameters: (t.parameters as Record<string, ToolParameter>) ?? {},
        required: (t.required as string[]) ?? [],
      }));
      onChange(imported);
      setBulkMode(false);
      setBulkError(null);
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <div className="tool-editor">
      <div className="tool-editor-header">
        <h4><Wrench size={14} /> Tools ({tools.length})</h4>
        <div className="tool-editor-actions">
          <button className="tool-small-btn" onClick={openBulkEditor} title="Edit all tools as JSON array">
            <FileJson size={13} /> Bulk JSON
          </button>
          <button className="tool-small-btn" onClick={loadAllPresets} title="Load all preset tools">
            <RotateCcw size={13} /> Presets
          </button>
          <button className="tool-small-btn" onClick={addTool} title="Add custom tool">
            <Plus size={13} /> New
          </button>
        </div>
      </div>

      {bulkMode && (
        <div className="bulk-json-editor">
          <p className="bulk-json-hint">
            Edit all tools as a JSON array. Each object needs <code>name</code>, <code>description</code>, <code>parameters</code>, and <code>required</code>.
          </p>
          <textarea
            className="json-textarea"
            value={bulkJson}
            onChange={(e) => { setBulkJson(e.target.value); setBulkError(null); }}
            rows={16}
            spellCheck={false}
          />
          {bulkError && <p className="json-error">{bulkError}</p>}
          <div className="json-editor-actions">
            <button className="tool-small-btn" onClick={saveBulkJson}>Save All</button>
            <button className="tool-small-btn" onClick={() => setBulkMode(false)}>Cancel</button>
          </div>
        </div>
      )}

      {tools.length === 0 && (
        <div className="tool-empty">
          <p>No tools defined. Add presets or create custom tools.</p>
          <div className="preset-chips">
            {PRESET_TOOLS.map((p) => (
              <button key={p.id} className="preset-chip" onClick={() => addPreset(p)}>
                + {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="tool-list">
        {tools.map((tool) => (
          <div key={tool.id} className="tool-card">
            <div className="tool-card-header" onClick={() => toggleExpand(tool.id)}>
              {expandedId === tool.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="tool-card-name">{tool.name || 'Unnamed tool'}</span>
              <span className="tool-card-params">{Object.keys(tool.parameters).length} params</span>
              <button
                className="param-remove-btn"
                onClick={(e) => { e.stopPropagation(); removeTool(tool.id); }}
                title="Remove tool"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {expandedId === tool.id && (
              <div className="tool-card-body">
                {jsonMode === tool.id ? (
                  <div className="json-editor">
                    <textarea
                      className="json-textarea"
                      value={jsonText}
                      onChange={(e) => { setJsonText(e.target.value); setJsonError(null); }}
                      rows={12}
                      spellCheck={false}
                    />
                    {jsonError && <p className="json-error">{jsonError}</p>}
                    <div className="json-editor-actions">
                      <button className="tool-small-btn" onClick={() => saveJson(tool.id)}>Save JSON</button>
                      <button className="tool-small-btn" onClick={() => setJsonMode(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="tool-field">
                      <label>Function name</label>
                      <input
                        type="text"
                        value={tool.name}
                        onChange={(e) => updateTool(tool.id, { name: e.target.value })}
                        placeholder="e.g. get_weather"
                      />
                    </div>
                    <div className="tool-field">
                      <label>Description</label>
                      <input
                        type="text"
                        value={tool.description}
                        onChange={(e) => updateTool(tool.id, { description: e.target.value })}
                        placeholder="What does this tool do?"
                      />
                    </div>
                    <div className="tool-field">
                      <label>Parameters</label>
                      <ParamEditor
                        params={tool.parameters}
                        required={tool.required}
                        onChangeParams={(p) => updateTool(tool.id, { parameters: p })}
                        onChangeRequired={(r) => updateTool(tool.id, { required: r })}
                      />
                    </div>
                    <button className="tool-small-btn json-toggle" onClick={() => openJsonEditor(tool)}>
                      <Copy size={12} /> Edit as JSON
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
