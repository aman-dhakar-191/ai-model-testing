import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export interface Chat {
  id: string;
  title: string;
  model: string;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  model?: string;
  tool_call_id?: string;
  tool_name?: string;
  is_streaming?: number;
}

export interface ToolCall {
  id: string;
  message_id: string;
  function_name: string;
  function_arguments: string;
}

export interface ChatSettings {
  chat_id: string;
  system_prompt: string;
  temperature: number;
  api_key?: string;
  provider: 'openrouter' | 'ollama';
  ollama_base_url?: string;
}

export interface TodoItem {
  id: string;
  chat_id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  created_at: number;
}

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const userDataPath = app.getPath('userData');
    const actualDbPath = dbPath || path.join(userDataPath, 'ai-model-testing.db');
    
    // Ensure directory exists
    const dir = path.dirname(actualDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(actualDbPath);
    this.db.pragma('journal_mode = WAL'); // Better concurrency
    this.db.pragma('foreign_keys = ON'); // Enable foreign keys
    
    this.initialize();
  }

  private initialize() {
    // Embedded schema to avoid file path issues
    const schema = `
-- Database schema for AI Model Testing app
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

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

CREATE TABLE IF NOT EXISTS tool_calls (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  function_name TEXT NOT NULL,
  function_arguments TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS instructions_used (
  chat_id TEXT NOT NULL,
  instruction_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  PRIMARY KEY (chat_id, instruction_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_settings (
  chat_id TEXT PRIMARY KEY,
  system_prompt TEXT NOT NULL,
  temperature REAL DEFAULT 0.7,
  api_key TEXT,
  provider TEXT NOT NULL DEFAULT 'openrouter' CHECK(provider IN ('openrouter', 'ollama')),
  ollama_base_url TEXT,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS todo_items (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tool_results (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  result TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_tool_calls_message_id ON tool_calls(message_id);
CREATE INDEX IF NOT EXISTS idx_instructions_chat_id ON instructions_used(chat_id);
CREATE INDEX IF NOT EXISTS idx_todos_chat_id ON todo_items(chat_id);
CREATE INDEX IF NOT EXISTS idx_tool_results_timestamp ON tool_results(timestamp);
CREATE INDEX IF NOT EXISTS idx_app_settings_updated ON app_settings(updated_at);
`;
    
    // Execute schema statements
    this.db.exec(schema);
    
    console.log('✅ Database initialized');
  }

  // ===== CHATS =====
  
  getAllChats(): Chat[] {
    const stmt = this.db.prepare('SELECT * FROM chats ORDER BY updated_at DESC');
    return stmt.all() as Chat[];
  }

  getChat(chatId: string): Chat | undefined {
    const stmt = this.db.prepare('SELECT * FROM chats WHERE id = ?');
    return stmt.get(chatId) as Chat | undefined;
  }

  createChat(chat: Chat): void {
    const stmt = this.db.prepare(`
      INSERT INTO chats (id, title, model, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(chat.id, chat.title, chat.model, chat.created_at, chat.updated_at);
  }

  updateChat(chatId: string, updates: Partial<Chat>): void {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length === 0) return;
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    
    const stmt = this.db.prepare(`UPDATE chats SET ${setClause} WHERE id = ?`);
    stmt.run(...values, chatId);
  }

  deleteChat(chatId: string): void {
    // Foreign keys will cascade delete messages, settings, todos, etc.
    const stmt = this.db.prepare('DELETE FROM chats WHERE id = ?');
    stmt.run(chatId);
  }

  // ===== MESSAGES =====
  
  getMessages(chatId: string): Message[] {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC');
    return stmt.all(chatId) as Message[];
  }

  addMessage(message: Message): void {
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, chat_id, role, content, timestamp, model, tool_call_id, tool_name, is_streaming)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      message.id,
      message.chat_id,
      message.role,
      message.content,
      message.timestamp,
      message.model || null,
      message.tool_call_id || null,
      message.tool_name || null,
      message.is_streaming ? 1 : 0
    );
  }

  updateMessage(messageId: string, content: string): void {
    const stmt = this.db.prepare('UPDATE messages SET content = ? WHERE id = ?');
    stmt.run(content, messageId);
  }

  // ===== TOOL CALLS =====
  
  getToolCalls(messageId: string): ToolCall[] {
    const stmt = this.db.prepare('SELECT * FROM tool_calls WHERE message_id = ?');
    return stmt.all(messageId) as ToolCall[];
  }

  addToolCall(toolCall: ToolCall): void {
    const stmt = this.db.prepare(`
      INSERT INTO tool_calls (id, message_id, function_name, function_arguments)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(toolCall.id, toolCall.message_id, toolCall.function_name, toolCall.function_arguments);
  }

  // ===== CHAT SETTINGS =====
  
  getChatSettings(chatId: string): ChatSettings | undefined {
    const stmt = this.db.prepare('SELECT * FROM chat_settings WHERE chat_id = ?');
    return stmt.get(chatId) as ChatSettings | undefined;
  }

  saveChatSettings(settings: ChatSettings): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chat_settings (chat_id, system_prompt, temperature, api_key, provider, ollama_base_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      settings.chat_id,
      settings.system_prompt,
      settings.temperature,
      settings.api_key || null,
      settings.provider,
      settings.ollama_base_url || null
    );
  }

  // ===== TODOS =====
  
  getTodos(chatId: string): TodoItem[] {
    const stmt = this.db.prepare('SELECT * FROM todo_items WHERE chat_id = ? ORDER BY created_at ASC');
    return stmt.all(chatId) as TodoItem[];
  }

  saveTodos(chatId: string, todos: TodoItem[]): void {
    // Delete existing todos for this chat
    const deleteStmt = this.db.prepare('DELETE FROM todo_items WHERE chat_id = ?');
    deleteStmt.run(chatId);
    
    // Insert new todos
    const insertStmt = this.db.prepare(`
      INSERT INTO todo_items (id, chat_id, title, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const todo of todos) {
      insertStmt.run(todo.id, chatId, todo.title, todo.status, todo.created_at);
    }
  }

  // ===== INSTRUCTIONS USED =====
  
  getInstructionsUsed(messageId: string): Array<{guide_id: string, title: string}> {
    const stmt = this.db.prepare('SELECT guide_id, title FROM instructions_used WHERE message_id = ?');
    return stmt.all(messageId) as Array<{guide_id: string, title: string}>;
  }

  addInstructionUsed(messageId: string, guideId: string, title: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO instructions_used (message_id, guide_id, title)
      VALUES (?, ?, ?)
    `);
    stmt.run(messageId, guideId, title);
  }

  // ===== TOOL RESULTS =====
  
  getToolResults(): Record<string, {name: string, result: string}> {
    const stmt = this.db.prepare('SELECT tool_call_id, name, result FROM tool_results');
    const rows = stmt.all() as Array<{tool_call_id: string, name: string, result: string}>;
    
    const results: Record<string, {name: string, result: string}> = {};
    for (const row of rows) {
      results[row.tool_call_id] = { name: row.name, result: row.result };
    }
    return results;
  }

  saveToolResult(toolCallId: string, name: string, result: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tool_results (id, tool_call_id, name, result, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const id = `${toolCallId}-result`;
    stmt.run(id, toolCallId, name, result, Date.now());
  }

  clearOldToolResults(daysOld: number = 7): void {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const stmt = this.db.prepare('DELETE FROM tool_results WHERE created_at < ?');
    stmt.run(cutoff);
  }

  // ===== APP SETTINGS =====
  
  getAppSetting(key: string): string | undefined {
    const stmt = this.db.prepare('SELECT value FROM app_settings WHERE key = ?');
    const row = stmt.get(key) as {value: string} | undefined;
    return row?.value;
  }

  setAppSetting(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(key, value, Date.now());
  }

  // ===== UTILITY =====
  
  close(): void {
    this.db.close();
  }

  vacuum(): void {
    this.db.exec('VACUUM');
  }

  getStats(): {
    chats: number;
    messages: number;
    todos: number;
    toolResults: number;
  } {
    const chatsCount = this.db.prepare('SELECT COUNT(*) as count FROM chats').get() as {count: number};
    const messagesCount = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as {count: number};
    const todosCount = this.db.prepare('SELECT COUNT(*) as count FROM todo_items').get() as {count: number};
    const toolResultsCount = this.db.prepare('SELECT COUNT(*) as count FROM tool_results').get() as {count: number};
    
    return {
      chats: chatsCount.count,
      messages: messagesCount.count,
      todos: todosCount.count,
      toolResults: toolResultsCount.count
    };
  }
}
