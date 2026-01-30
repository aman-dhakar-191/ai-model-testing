import { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SettingsPanel from './components/SettingsPanel';
import ExportMenu from './components/ExportMenu';
import { useLocalStorage } from './hooks/useLocalStorage';
import { sendMessage } from './utils/api';
import { DEFAULT_SETTINGS } from './utils/constants';
import type { Chat, ChatSettings, Message } from './types';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async (content: string) => {
    if (!activeChat) return;
    setError(null);

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
    try {
      const currentSettings = activeChat.settings;
      const allMessages = [...activeChat.messages, userMessage];
      const responseContent = await sendMessage(allMessages, currentSettings);

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
        model: currentSettings.model,
      };

      updateChat(activeChat.id, (c) => ({
        ...c,
        messages: [...c.messages, userMessage, assistantMessage],
        updatedAt: Date.now(),
        title: isFirstMessage ? title : c.title,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const displayChat = chats.find((c) => c.id === activeChatId) ?? null;

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
                Configure settings or start typing below.
              </p>
            </div>
          ) : (
            <div className="messages-list">
              {displayChat.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {loading && (
                <div className="chat-message assistant">
                  <div className="message-avatar typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                  <div className="message-body">
                    <div className="message-content">Thinking...</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error && (
          <div className="error-bar">
            {error}
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {displayChat && (
          <ChatInput onSend={handleSendMessage} disabled={loading} />
        )}
      </main>
    </div>
  );
}
