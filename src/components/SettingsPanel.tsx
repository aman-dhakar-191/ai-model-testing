import { Settings, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useState, useEffect, type ReactNode } from 'react';
import { OPENROUTER_MODELS, DEFAULT_SETTINGS } from '../utils/constants';
import type { ChatSettings, ModelOption } from '../types';

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
  const [ollamaModels, setOllamaModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [updateCheckMessage, setUpdateCheckMessage] = useState<string>('');

  const isOllama = settings.provider === 'ollama';

  // Get current version on mount
  useEffect(() => {
    if (window.electron?.updater) {
      window.electron.updater.getCurrentVersion()
        .then(setCurrentVersion)
        .catch(console.error);
    }
  }, []);

  // Fetch Ollama models when provider changes to Ollama
  useEffect(() => {
    if (isOllama && ollamaModels.length === 0) {
      setLoadingModels(true);
      window.electron.ollama.listModels()
        .then(modelNames => {
          const models: ModelOption[] = modelNames.map(name => ({
            id: name,
            name: name,
            provider: 'Ollama'
          }));
          setOllamaModels(models);
          
          // If current model is not in the list, select the first available model
          if (models.length > 0 && !modelNames.includes(settings.model)) {
            onChange({ ...settings, model: models[0].id });
          }
        })
        .catch(err => {
          console.error('Failed to fetch Ollama models:', err);
          setOllamaModels([]);
        })
        .finally(() => setLoadingModels(false));
    }
  }, [isOllama, ollamaModels.length, settings, onChange]);

  const models = isOllama ? ollamaModels : OPENROUTER_MODELS;

  const handleProviderChange = (provider: 'openrouter' | 'ollama') => {
    let newModel: string;
    if (provider === 'ollama') {
      // Use first available Ollama model or empty string
      newModel = ollamaModels.length > 0 ? ollamaModels[0].id : '';
    } else {
      newModel = 'tngtech/deepseek-r1t2-chimera:free';
    }
    onChange({ ...settings, provider, model: newModel });
  };

  const handleCheckForUpdates = async () => {
    if (!window.electron?.updater) {
      setUpdateCheckMessage('Update service not available');
      setTimeout(() => setUpdateCheckMessage(''), 3000);
      return;
    }
    
    setCheckingUpdates(true);
    setUpdateCheckMessage('');
    try {
      const hasUpdate = await window.electron.updater.checkForUpdates();
      if (!hasUpdate) {
        setUpdateCheckMessage('You are already running the latest version!');
      } else {
        setUpdateCheckMessage('Update available! Check the notification.');
      }
      setTimeout(() => setUpdateCheckMessage(''), 5000);
    } catch (err) {
      setUpdateCheckMessage(err instanceof Error ? err.message : 'Failed to check for updates');
      setTimeout(() => setUpdateCheckMessage(''), 5000);
    } finally {
      setCheckingUpdates(false);
    }
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
          disabled={isOllama && loadingModels}
        >
          {isOllama && loadingModels ? (
            <option>Loading models...</option>
          ) : isOllama && ollamaModels.length === 0 ? (
            <option>No models found. Run: ollama pull &lt;model&gt;</option>
          ) : (
            models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))
          )}
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

      <div className="settings-divider" />

      <div className="setting-label">
        <button
          className="secondary-btn"
          onClick={() => onChange({ ...settings, systemPrompt: DEFAULT_SETTINGS.systemPrompt })}
          style={{ width: '100%', marginBottom: '0.5rem' }}
          title="Reset system prompt to the latest default version"
        >
          🔄 Reset System Prompt to Default
        </button>
        <small style={{ color: '#888', fontSize: '0.85em' }}>
          Use this to update old chats with the latest system prompt improvements
        </small>
      </div>

      <div className="settings-divider" />

      {/* Update Check Section */}
      {window.electron?.updater && (
        <div className="setting-label">
          <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '500' }}>Application Updates</span>
            {currentVersion && (
              <small style={{ color: '#888', fontSize: '0.85em' }}>
                v{currentVersion}
              </small>
            )}
          </div>
          <button
            className="secondary-btn"
            onClick={handleCheckForUpdates}
            disabled={checkingUpdates}
            style={{ 
              width: '100%', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            title="Check for application updates"
          >
            <RefreshCw size={16} className={checkingUpdates ? 'spinning' : ''} />
            {checkingUpdates ? 'Checking...' : 'Check for Updates'}
          </button>
          {updateCheckMessage && (
            <small style={{ 
              color: updateCheckMessage.includes('available') ? '#10b981' : '#888', 
              fontSize: '0.85em',
              display: 'block'
            }}>
              {updateCheckMessage}
            </small>
          )}
          <small style={{ color: '#888', fontSize: '0.85em' }}>
            Automatically checks for updates every 6 hours
          </small>
        </div>
      )}

      {thinkingGuide}
      {instructionGuide}
      {toolGuide}
      {toolEditor}
    </div>
  );
}
