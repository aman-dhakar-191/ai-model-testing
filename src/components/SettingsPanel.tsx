import { Settings, Eye, EyeOff } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { OPENROUTER_MODELS, OLLAMA_MODELS } from '../utils/constants';
import type { ChatSettings } from '../types';

interface SettingsPanelProps {
  settings: ChatSettings;
  onChange: (settings: ChatSettings) => void;
  open: boolean;
  onToggle: () => void;
  toolEditor?: ReactNode;
  toolGuide?: ReactNode;
  thinkingGuide?: ReactNode;
  instructionGuide?: ReactNode;
}

export default function SettingsPanel({ settings, onChange, open, onToggle, toolEditor, toolGuide, thinkingGuide, instructionGuide }: SettingsPanelProps) {
  const [showKey, setShowKey] = useState(false);

  const isOllama = settings.provider === 'ollama';
  const models = isOllama ? OLLAMA_MODELS : OPENROUTER_MODELS;
  const grouped = models.reduce<Record<string, typeof models>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  const handleProviderChange = (provider: 'openrouter' | 'ollama') => {
    const newModel = provider === 'ollama' ? 'llama3.1:8b' : 'tngtech/deepseek-r1t2-chimera:free';
    onChange({ ...settings, provider, model: newModel });
  };

  if (!open) {
    return (
      <button className="settings-toggle" onClick={onToggle} title="Open settings">
        <Settings size={18} />
        <span>Settings</span>
      </button>
    );
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>
          <Settings size={16} /> Settings
        </h3>
        <button className="close-btn" onClick={onToggle}>
          &times;
        </button>
      </div>

      <label className="setting-label">
        Provider
        <select
          value={settings.provider}
          onChange={(e) => handleProviderChange(e.target.value as 'openrouter' | 'ollama')}
        >
          <option value="openrouter">OpenRouter (Cloud)</option>
          <option value="ollama">Ollama (Local)</option>
        </select>
      </label>

      {isOllama ? (
        <label className="setting-label">
          Ollama Base URL
          <input
            type="text"
            value={settings.ollamaBaseUrl}
            onChange={(e) => onChange({ ...settings, ollamaBaseUrl: e.target.value })}
            placeholder="http://localhost:11434"
          />
          <small style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
            Make sure Ollama is running locally
          </small>
        </label>
      ) : (
        <label className="setting-label">
          API Key
          <div className="api-key-input">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={(e) => onChange({ ...settings, apiKey: e.target.value })}
              placeholder="sk-or-..."
            />
            <button className="icon-btn" onClick={() => setShowKey(!showKey)} title={showKey ? 'Hide' : 'Show'}>
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
      )}

      <label className="setting-label">
        Model
        <select
          value={settings.model}
          onChange={(e) => onChange({ ...settings, model: e.target.value })}
        >
          {Object.entries(grouped).map(([provider, models]) => (
            <optgroup key={provider} label={provider}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="setting-label">
        Temperature: {settings.temperature.toFixed(1)}
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => onChange({ ...settings, temperature: parseFloat(e.target.value) })}
        />
        <div className="range-labels">
          <span>Precise (0)</span>
          <span>Creative (2)</span>
        </div>
      </label>

      <label className="setting-label">
        System Prompt
        <textarea
          value={settings.systemPrompt}
          onChange={(e) => onChange({ ...settings, systemPrompt: e.target.value })}
          placeholder="You are a helpful assistant..."
          rows={4}
        />
      </label>

      <div className="settings-divider" />

      {thinkingGuide}
      {instructionGuide}
      {toolGuide}
      {toolEditor}
    </div>
  );
}
