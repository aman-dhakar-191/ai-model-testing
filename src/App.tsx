import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, RotateCcw } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SettingsPanel from './components/SettingsPanel';
import ExportMenu from './components/ExportMenu';
import ToolEditor from './components/ToolEditor';
import ToolGuide from './components/ToolGuide';
import ThinkingGuide from './components/ThinkingGuide';
import { useLocalStorage } from './hooks/useLocalStorage';
import { sendMessageStreaming } from './utils/api';
import { executeMockTool } from './utils/mockTools';
import { INSTRUCTION_TOOLS, executeInstructionTool, isInstructionTool } from './utils/instructions';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map of toolCallId -> { name, result } for rendering
  const [toolResultsMap, setToolResultsMap] = useLocalStorage<Record<string, { name: string; result: string }>>(
    'ai-testing-tool-results',
    {},
  );

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

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

  // Combine user tools + built-in instruction tools
  const allTools = [...INSTRUCTION_TOOLS, ...tools];

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
    try {
      const currentSettings = activeChat.settings;
      let allMessages = [...activeChat.messages, userMessage];

      let maxRounds = 10;
      const newMessages: Message[] = [userMessage];
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

          updateChat(activeChat.id, (c) => ({
            ...c,
            messages: [...c.messages, ...newMessages],
            updatedAt: Date.now(),
            title: isFirstMessage ? title : c.title,
          }));
          if (Object.keys(newResults).length > 0) {
            setToolResultsMap((prev) => ({ ...prev, ...newResults }));
          }
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
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setLastFailedMessage(content);
    } finally {
      setLoading(false);
      setStreamingContent('');
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
            <ExportMenu chat={displayChat} />
            <SettingsPanel
              settings={activeChat?.settings ?? globalSettings}
              onChange={handleSettingsChange}
              open={settingsOpen}
              onToggle={() => setSettingsOpen(!settingsOpen)}
              toolEditor={<ToolEditor tools={tools} onChange={setTools} />}
              toolGuide={<ToolGuide />}
              thinkingGuide={<ThinkingGuide />}
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

        {displayChat && (
          <ChatInput onSend={handleSendMessage} disabled={loading} />
        )}
      </main>
    </div>
  );
}
