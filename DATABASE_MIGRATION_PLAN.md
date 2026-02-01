# SQLite Database Migration Plan

## Overview
Replace localStorage with SQLite database for better data management in Electron app.

## Technology Stack
- **better-sqlite3** - Synchronous SQLite3 bindings (faster for Electron)
- **Electron main process** - Database operations via IPC
- **Migration script** - Move existing localStorage data to DB

## Database Schema

```sql
-- Chats table
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Messages table
CREATE TABLE messages (
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
CREATE TABLE tool_calls (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  function_name TEXT NOT NULL,
  function_arguments TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Instructions used table (for tracking fetched guides)
CREATE TABLE instructions_used (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL,
  guide_id TEXT NOT NULL,
  title TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Chat settings table
CREATE TABLE chat_settings (
  chat_id TEXT PRIMARY KEY,
  system_prompt TEXT NOT NULL,
  temperature REAL DEFAULT 0.7,
  api_key TEXT,
  provider TEXT NOT NULL CHECK(provider IN ('openrouter', 'ollama')),
  ollama_base_url TEXT,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Todo items table
CREATE TABLE todo_items (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'in-progress', 'completed')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Tool results table (for UI display)
CREATE TABLE tool_results (
  id TEXT PRIMARY KEY,
  tool_call_id TEXT NOT NULL,
  name TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- App settings table
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_tool_calls_message_id ON tool_calls(message_id);
CREATE INDEX idx_todo_items_chat_id ON todo_items(chat_id);
CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC);
```

## Implementation Steps

### 1. Install Dependencies
```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

### 2. Create Database Service (Electron Main Process)
`electron/database.ts` - Database initialization and operations

### 3. Add IPC Handlers (Electron Main)
```typescript
// electron/main.ts
ipcMain.handle('db-get-chats', () => database.getChats())
ipcMain.handle('db-get-chat', (_, chatId) => database.getChat(chatId))
ipcMain.handle('db-save-chat', (_, chat) => database.saveChat(chat))
ipcMain.handle('db-delete-chat', (_, chatId) => database.deleteChat(chatId))
ipcMain.handle('db-add-message', (_, message) => database.addMessage(message))
// ... more handlers
```

### 4. Create Database Service (Renderer)
`src/services/DatabaseService.ts` - Wrapper for IPC calls

### 5. Update App.tsx
Replace useLocalStorage hooks with DatabaseService calls

### 6. Migration Script
`electron/migrate-localstorage.ts` - One-time migration from localStorage to SQLite

### 7. Fallback for Web Builds
Keep localStorage for non-Electron builds (web preview)

## Migration Strategy

1. **Detect first launch** with DB
2. **Check localStorage** for existing data
3. **Migrate data** to SQLite
4. **Clear localStorage** (optional)
5. **Set migration flag** to prevent re-migration

## File Structure
```
electron/
  ├── database.ts          # Database class with methods
  ├── database-schema.sql  # Schema definition
  ├── migrate.ts           # Migration from localStorage
  └── main.ts              # IPC handlers

src/
  ├── services/
  │   ├── DatabaseService.ts    # Renderer-side DB wrapper
  │   └── StorageAdapter.ts     # Abstract storage interface
  └── hooks/
      └── useDatabase.ts        # React hook for DB operations
```

## Benefits

✅ **Better Performance** - Indexed queries, joins, aggregations
✅ **Data Integrity** - Foreign keys, constraints, transactions
✅ **No Size Limits** - Store unlimited chats and messages
✅ **Better Queries** - Search, filter, sort efficiently
✅ **Backup/Restore** - Single .db file
✅ **Export Options** - Easy to export to JSON/CSV
✅ **Future Features** - Analytics, chat search, message editing history

## Considerations

⚠️ **Electron Only** - Web builds need localStorage fallback
⚠️ **Migration Testing** - Test with various localStorage states
⚠️ **Backward Compatibility** - Keep ability to import old exports
⚠️ **DB File Location** - Use app.getPath('userData')
⚠️ **Concurrent Access** - better-sqlite3 handles this well

## Next Steps

1. Create database schema and service
2. Add IPC handlers in Electron main
3. Create DatabaseService for renderer
4. Update App.tsx to use DatabaseService
5. Create migration script
6. Test thoroughly
7. Add database backup/restore UI
