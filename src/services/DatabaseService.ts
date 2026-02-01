/**
 * Renderer-side Database Service
 * Provides a wrapper around IPC calls to the main process database
 */

import type { Chat, Message, ToolCall, ChatSettings, TodoItem } from '../../electron/database';

export class DatabaseService {
  static async getChats(): Promise<Chat[]> {
    if (!window.electron?.db) return [];
    return window.electron.db.getChats();
  }

  static async getChat(chatId: string): Promise<Chat | null> {
    if (!window.electron?.db) return null;
    return window.electron.db.getChat(chatId);
  }

  static async createChat(chat: Chat): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.createChat(chat);
  }

  static async updateChat(chatId: string, updates: Partial<Chat>): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.updateChat(chatId, updates);
  }

  static async deleteChat(chatId: string): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.deleteChat(chatId);
  }

  static async getMessages(chatId: string): Promise<Message[]> {
    if (!window.electron?.db) return [];
    return window.electron.db.getMessages(chatId);
  }

  static async addMessage(message: Message): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.addMessage(message);
  }

  static async updateMessage(messageId: string, content: string): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.updateMessage(messageId, content);
  }

  static async getToolCalls(messageId: string): Promise<ToolCall[]> {
    if (!window.electron?.db) return [];
    return window.electron.db.getToolCalls(messageId);
  }

  static async addToolCall(toolCall: ToolCall): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.addToolCall(toolCall);
  }

  static async getChatSettings(chatId: string): Promise<ChatSettings | null> {
    if (!window.electron?.db) return null;
    return window.electron.db.getChatSettings(chatId);
  }

  static async saveChatSettings(settings: ChatSettings): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.saveChatSettings(settings);
  }

  static async getTodos(chatId: string): Promise<TodoItem[]> {
    if (!window.electron?.db) return [];
    return window.electron.db.getTodos(chatId);
  }

  static async saveTodos(chatId: string, todos: TodoItem[]): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.saveTodos(chatId, todos);
  }

  static async getToolResults(): Promise<any[]> {
    if (!window.electron?.db) return [];
    return window.electron.db.getToolResults();
  }

  static async saveToolResult(id: string, name: string, result: string): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.saveToolResult(id, name, result);
  }

  static async clearOldToolResults(): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.clearOldToolResults();
  }

  static async getInstructionsUsed(chatId: string): Promise<any[]> {
    if (!window.electron?.db) return [];
    return window.electron.db.getInstructionsUsed(chatId);
  }

  static async addInstructionUsed(chatId: string, instructionId: string): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.addInstructionUsed(chatId, instructionId);
  }

  static async getAppSetting(key: string): Promise<string | null> {
    if (!window.electron?.db) return null;
    return window.electron.db.getAppSetting(key);
  }

  static async setAppSetting(key: string, value: string): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.setAppSetting(key, value);
  }

  static async getStats(): Promise<any> {
    if (!window.electron?.db) return {};
    return window.electron.db.getStats();
  }

  static async vacuum(): Promise<void> {
    if (!window.electron?.db) return;
    await window.electron.db.vacuum();
  }

  /**
   * Check if running in Electron environment
   */
  static isElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electron?.db;
  }

  /**
   * Migrate data from localStorage to database
   */
  static async migrateFromLocalStorage(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already migrated
      const migrated = await this.getAppSetting('migrated_from_localstorage');
      if (migrated === 'true') {
        return { success: true };
      }

      console.log('Starting localStorage to SQLite migration...');

      // Migrate chats
      const chatsJson = localStorage.getItem('chats');
      if (chatsJson) {
        const chats = JSON.parse(chatsJson);
        for (const chat of chats) {
          await this.createChat(chat);
          
          // Migrate messages
          if (chat.messages && Array.isArray(chat.messages)) {
            for (const message of chat.messages) {
              await this.addMessage({
                ...message,
                chat_id: chat.id,
              });
            }
          }
        }
        console.log(`Migrated ${chats.length} chats`);
      }

      // Migrate tool results
      const toolResultsJson = localStorage.getItem('tool-results');
      if (toolResultsJson) {
        const toolResults = JSON.parse(toolResultsJson);
        for (const [id, result] of Object.entries(toolResults)) {
          if (typeof result === 'object' && result !== null) {
            const toolResult = result as any;
            await this.saveToolResult(
              id,
              toolResult.name || 'unknown',
              JSON.stringify(toolResult.result || '')
            );
          }
        }
        console.log('Migrated tool results');
      }

      // Migrate settings
      const skipProjectCheck = localStorage.getItem('skip-project-check');
      if (skipProjectCheck) {
        await this.setAppSetting('skip_project_check', skipProjectCheck);
      }

      const lastProjectDir = localStorage.getItem('last-project-dir');
      if (lastProjectDir) {
        await this.setAppSetting('last_project_dir', lastProjectDir);
      }

      // Mark migration as complete
      await this.setAppSetting('migrated_from_localstorage', 'true');
      console.log('Migration complete!');

      return { success: true };
    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
