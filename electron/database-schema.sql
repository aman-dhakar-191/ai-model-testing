-- Database schema for AI Model Testing app
-- SQLite version 3

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  model TEXT,
  tool_call_id TEXT,
  tool_name TEXT,
  is_streaming INTEGER DEFAULT 0,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Tool calls table (for assistant messages)
CREATE TABLE IF NOT EXISTS tool_calls (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  function_name TEXT NOT NULL,
  function_arguments TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Instructions used table (for tracking fetched guides)
CREATE TABLE IF NOT EXISTS instructions_used (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL,
  guide_id TEXT NOT NULL,
  title TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Chat settings table
CREATE TABLE IF NOT EXISTS chat_settings (
  chat_id TEXT PRIMARY KEY,
  system_prompt TEXT NOT NULL,
  temperature REAL DEFAULT 0.7,
  api_key TEXT,
  provider TEXT NOT NULL CHECK(provider IN ('openrouter', 'ollama')),
  ollama_base_url TEXT,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Todo items table
CREATE TABLE IF NOT EXISTS todo_items (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'in-progress', 'completed')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Tool results table (for UI display)
CREATE TABLE IF NOT EXISTS tool_results (
  id TEXT PRIMARY KEY,
  tool_call_id TEXT NOT NULL,
  name TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_tool_calls_message_id ON tool_calls(message_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_chat_id ON todo_items(chat_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_instructions_message_id ON instructions_used(message_id);
CREATE INDEX IF NOT EXISTS idx_tool_results_tool_call_id ON tool_results(tool_call_id);
