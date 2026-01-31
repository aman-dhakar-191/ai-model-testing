import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, RotateCcw, StopCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SettingsPanel from './components/SettingsPanel';
import ExportMenu from './components/ExportMenu';
import ToolEditor from './components/ToolEditor';
import ToolGuide from './components/ToolGuide';
import ThinkingGuide from './components/ThinkingGuide';
import FetchInstructionGuide from './components/FetchInstructionGuide';
import WorkingDirectory from './components/WorkingDirectory';
import SalesforceOrgManager from './components/SalesforceOrgManager';
import ProjectSetupModal from './components/ProjectSetupModal';
import FileExplorer from './components/FileExplorer';
import { useLocalStorage } from './hooks/useLocalStorage';
import { sendMessageStreaming } from './utils/api';
import { executeMockTool } from './utils/mockTools';
import { INSTRUCTION_TOOLS, executeInstructionTool, isInstructionTool } from './utils/instructions';
import { SALESFORCE_TOOLS, executeSalesforceTool, isSalesforceTool } from './utils/salesforceToolsRenderer';
import { DEPLOY_TOOLS, executeDeployTool, isDeployTool } from './utils/deployTools';
import { DEFAULT_SETTINGS } from './utils/constants';
import { getStreamingThinking, isCurrentlyThinking } from './utils/thinking';
import ThinkingBlock from './components/ThinkingBlock';
import type { Chat, ChatSettings, Message, ToolDefinition } from './types';

function generateId() {
  return crypto.randomUUID();
}

function createNewChat(settings: ChatSettings): Chat {
  return {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: { ...settings },
  };
}

export default function App() {
  const [chats, setChats] = useLocalStorage<Chat[]>('ai-testing-chats', []);
  const [activeChatId, setActiveChatId] = useLocalStorage<string | null>('ai-testing-active', null);
  const [globalSettings, setGlobalSettings] = useLocalStorage<ChatSettings>('ai-testing-settings', DEFAULT_SETTINGS);
  const [tools, setTools] = useLocalStorage<ToolDefinition[]>('ai-testing-tools', []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [showProjectSetup, setShowProjectSetup] = useState(false);
  const [skipProjectCheck, setSkipProjectCheck] = useLocalStorage('skip-project-check', false);
  const [lastProjectDir, setLastProjectDir] = useLocalStorage<string | null>('last-project-dir', null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Map of toolCallId -> { name, result } for rendering
  const [toolResultsMap, setToolResultsMap] = useLocalStorage<Record<string, { name: string; result: string }>>(
    'ai-testing-tool-results',
    {},
  );

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  // Check if current directory is a Salesforce project
  const checkProject = useCallback(async () => {
    try {
      const workingDir = await window.electron.salesforce.getWorkingDirectory();
      const isProject = await window.electron.sfCli.checkIfSalesforceProject(workingDir);
      
      if (!isProject) {
        // Current directory is not a Salesforce project
        // Check if we have a valid last project directory
        if (lastProjectDir) {
          const lastDirIsValid = await window.electron.sfCli.checkIfSalesforceProject(lastProjectDir);
          if (lastDirIsValid) {
            // Don't show modal if we have a valid last project (user can manually switch if needed)
            if (!skipProjectCheck) {
              setShowProjectSetup(false);
            }
            return;
          }
        }
        
        // No valid project found, show setup modal (unless user has disabled it)
        if (!skipProjectCheck) {
          setShowProjectSetup(true);
        }
      } else {
        // Current directory is a valid Salesforce project
        setShowProjectSetup(false);
        setLastProjectDir(workingDir);
      }
    } catch (error) {
      console.error('Failed to check project status:', error);
    }
  }, [skipProjectCheck, lastProjectDir, setLastProjectDir]);

  useEffect(() => {
    checkProject();
  }, [checkProject]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages.length, scrollToBottom]);

  const updateChat = (id: string, updater: (chat: Chat) => Chat) => {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  };

  const handleNewChat = () => {
    const chat = createNewChat(globalSettings);
    setChats((prev) => [...prev, chat]);
    setActiveChatId(chat.id);
    setError(null);
    setLastFailedMessage(null);
  };

  const handleDeleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setError(null);
    setLastFailedMessage(null);
  };

  const handleSettingsChange = (newSettings: ChatSettings) => {
    setGlobalSettings(newSettings);
    if (activeChat) {
      updateChat(activeChat.id, (c) => ({
        ...c,
        settings: { ...newSettings },
        updatedAt: Date.now(),
      }));
    }
  };

  // Combine user tools + built-in instruction tools + Salesforce tools
  const allTools = [...INSTRUCTION_TOOLS, ...SALESFORCE_TOOLS, ...DEPLOY_TOOLS, ...tools];

  const handleSendMessage = async (content: string) => {
    if (!activeChat) return;
    setError(null);
    setLastFailedMessage(null);

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const isFirstMessage = activeChat.messages.length === 0;
    const title = isFirstMessage ? content.slice(0, 40) + (content.length > 40 ? '...' : '') : activeChat.title;

    updateChat(activeChat.id, (c) => ({
      ...c,
      title,
      messages: [...c.messages, userMessage],
      updatedAt: Date.now(),
    }));

    setLoading(true);
    setStreamingContent('');
    abortControllerRef.current = new AbortController();

    try {
      const currentSettings = activeChat.settings;
      let allMessages = [...activeChat.messages, userMessage];

      let maxRounds = 10;
      const newMessages: Message[] = [];
      const newResults: Record<string, { name: string; result: string }> = {};
      const fetchedInstructions: { guideId: string; title: string }[] = [];

      while (maxRounds > 0) {
        maxRounds--;

        const response = await sendMessageStreaming(
          allMessages,
          currentSettings,
          allTools,
          (token) => {
            setStreamingContent((prev) => prev + token);
          },
          abortControllerRef.current.signal,
        );

        if (response.toolCalls && response.toolCalls.length > 0) {
          setStreamingContent('');

          const assistantMsg: Message = {
            id: generateId(),
            role: 'assistant',
            content: response.content || '',
            timestamp: Date.now(),
            model: currentSettings.model,
            toolCalls: response.toolCalls,
          };
          newMessages.push(assistantMsg);
          allMessages = [...allMessages, assistantMsg];

          for (const call of response.toolCalls) {
            let result: string;

            if (isInstructionTool(call.function.name)) {
              result = await executeInstructionTool(call.function.name, call.function.arguments);

              if (call.function.name === 'fetch_instruction') {
                try {
                  const parsed = JSON.parse(result);
                  if (parsed.title && parsed.guide_id) {
                    fetchedInstructions.push({ guideId: parsed.guide_id, title: parsed.title });
                  }
                } catch { /* ignore parse errors */ }
              }
            } else if (isSalesforceTool(call.function.name)) {
              result = await executeSalesforceTool(call.function.name, call.function.arguments);
            } else if (isDeployTool(call.function.name)) {
              result = await executeDeployTool(call.function.name, call.function.arguments);
            } else {
              result = executeMockTool(call.function.name, call.function.arguments);
            }

            newResults[call.id] = { name: call.function.name, result };

            const toolMsg: Message = {
              id: generateId(),
              role: 'tool',
              content: result,
              timestamp: Date.now(),
              toolCallId: call.id,
              toolName: call.function.name,
            };
            newMessages.push(toolMsg);
            allMessages = [...allMessages, toolMsg];
          }

          // Don't update chat here - we'll do it at the end of the loop or when done
        } else {
          const assistantMsg: Message = {
            id: generateId(),
            role: 'assistant',
            content: response.content || 'No response received.',
            timestamp: Date.now(),
            model: currentSettings.model,
            instructionsUsed: fetchedInstructions.length > 0 ? fetchedInstructions : undefined,
          };
          newMessages.push(assistantMsg);
          setStreamingContent('');
          break;
        }
      }

      if (Object.keys(newResults).length > 0) {
        setToolResultsMap((prev) => ({ ...prev, ...newResults }));
      }

      updateChat(activeChat.id, (c) => ({
        ...c,
        messages: [...c.messages, ...newMessages],
        updatedAt: Date.now(),
        title: isFirstMessage ? title : c.title,
      }));
    } catch (err) {
      setStreamingContent('');
      // Check if error is abort error
      if (err instanceof Error && err.name === 'AbortError') {
        // Task was interrupted, don't show error
        return;
      }
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setLastFailedMessage(content);
    } finally {
      setLoading(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    if (!lastFailedMessage || !activeChat) return;

    updateChat(activeChat.id, (c) => {
      const messages = [...c.messages];
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          messages.splice(i, 1);
          break;
        }
      }
      return { ...c, messages, updatedAt: Date.now() };
    });

    setError(null);
    const msg = lastFailedMessage;
    setLastFailedMessage(null);
    setTimeout(() => handleSendMessage(msg), 50);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setStreamingContent('');
    }
  };

  const displayChat = chats.find((c) => c.id === activeChatId) ?? null;
  const resultsMap = new Map(Object.entries(toolResultsMap));

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelect={handleSelectChat}
        onNew={handleNewChat}
        onDelete={handleDeleteChat}
      />
      <FileExplorer />
      <main className="main-area">
        <header className="main-header">
          <div className="header-left">
            <h1>AI Model Testing</h1>
            {displayChat && (
              <span className="header-model">
                {displayChat.settings.model.split('/').pop()}
              </span>
            )}
          </div>
          <div className="header-right">
            <SalesforceOrgManager />
            <ExportMenu chat={displayChat} />
            <SettingsPanel
              settings={activeChat?.settings ?? globalSettings}
              onChange={handleSettingsChange}
              open={settingsOpen}
              onToggle={() => setSettingsOpen(!settingsOpen)}
              toolEditor={<ToolEditor tools={tools} onChange={setTools} />}
              toolGuide={<ToolGuide />}
              thinkingGuide={<ThinkingGuide />}
              instructionGuide={<FetchInstructionGuide />}
            />
          </div>
        </header>

        <div className="chat-area">
          {!displayChat ? (
            <div className="empty-state">
              <h2>Welcome to AI Model Testing</h2>
              <p>Create a new chat to start testing AI models via OpenRouter.</p>
              <button className="primary-btn" onClick={handleNewChat}>
                Start New Chat
              </button>
            </div>
          ) : displayChat.messages.length === 0 ? (
            <div className="empty-state">
              <h2>New Conversation</h2>
              <p>
                Using <strong>{displayChat.settings.model.split('/').pop()}</strong>.
                {tools.length > 0 && (
                  <> With <strong>{tools.length} tool{tools.length > 1 ? 's' : ''}</strong> enabled.</>
                )}
                {' '}Instruction guides are always available. Configure settings or start typing below.
              </p>
            </div>
          ) : (
            <div className="messages-list">
              {displayChat.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} toolResults={resultsMap} />
              ))}
              {loading && (() => {
                const streamThinking = streamingContent ? getStreamingThinking(streamingContent) : null;
                const currentlyThinking = streamingContent ? isCurrentlyThinking(streamingContent) : false;
                return (
                  <div className="chat-message assistant">
                    <div className="message-avatar">
                      {streamingContent ? (
                        <Bot size={18} />
                      ) : (
                        <span className="typing">
                          <span className="dot" />
                          <span className="dot" />
                          <span className="dot" />
                        </span>
                      )}
                    </div>
                    <div className="message-body">
                      <div className="message-header">
                        <span className="message-role">Assistant</span>
                        <span className="message-model streaming-badge">
                          {currentlyThinking ? 'thinking...' : 'streaming...'}
                        </span>
                      </div>
                      {streamThinking?.thinking && (
                        <ThinkingBlock content={streamThinking.thinking} isStreaming={currentlyThinking} />
                      )}
                      <div className="message-content">
                        {streamThinking?.visible || (!streamingContent ? 'Waiting for response...' : '')}
                        {streamThinking?.visible && !currentlyThinking && <span className="streaming-cursor" />}
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error && (
          <div className="error-bar">
            <span className="error-text">{error}</span>
            <div className="error-actions">
              {lastFailedMessage && (
                <button className="retry-btn" onClick={handleRetry} title="Retry last message">
                  <RotateCcw size={14} /> Retry
                </button>
              )}
              <button className="error-close" onClick={() => { setError(null); setLastFailedMessage(null); }}>&times;</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-bar">
            <span className="loading-text">Processing...</span>
            <button className="stop-btn" onClick={handleStop} title="Stop current task">
              <StopCircle size={16} /> Stop
            </button>
          </div>
        )}

        {displayChat && (
          <ChatInput onSend={handleSendMessage} disabled={loading} />
        )}
      </main>

      {showProjectSetup && (
        <ProjectSetupModal 
          onClose={(options) => {
            setShowProjectSetup(false);
            
            // Handle "Don't show again" option
            if (options?.dontShowAgain) {
              setSkipProjectCheck(true);
            }
            
            // Save the selected project directory
            if (options?.projectDir) {
              setLastProjectDir(options.projectDir);
            }
            
            // Re-check project status after a short delay
            setTimeout(() => checkProject(), 500);
          }} 
        />
      )}
    </div>
  );
}
