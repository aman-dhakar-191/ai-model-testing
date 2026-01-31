/**
 * Configuration Manager - Persistent storage with versioning and validation
 * Provides enterprise-grade configuration management with history tracking
 */

import { eventBus, AppEvents } from './EventBus';
import { errorHandler } from './ErrorHandler';

export interface ConfigSchema {
  version: string;
  schemaVersion: number;
  timestamp: number;
  data: Record<string, any>;
  metadata?: {
    lastModified: number;
    modifiedBy?: string;
    changeReason?: string;
  };
}

export interface ConfigHistory {
  id: string;
  timestamp: number;
  version: string;
  changes: Partial<ConfigSchema['data']>;
  previousData: Record<string, any>;
}

export interface ConfigValidationRule {
  key: string;
  validate: (value: any) => boolean;
  errorMessage: string;
}

export interface ConfigMigration {
  fromVersion: number;
  toVersion: number;
  migrate: (data: Record<string, any>) => Record<string, any>;
}

class ConfigurationManager {
  private currentVersion = '1.0.0';
  private schemaVersion = 1;
  private storagePrefix = 'app-config';
  private maxHistorySize = 50;
  private validationRules: Map<string, ConfigValidationRule> = new Map();
  private migrations: ConfigMigration[] = [];

  /**
   * Initialize configuration manager with default values
   */
  async initialize(defaults: Record<string, any>): Promise<void> {
    try {
      const existing = await this.load();
      
      if (!existing) {
        // No config exists, create with defaults
        await this.save(defaults, 'Initial configuration');
        console.log('[ConfigManager] Initialized with defaults');
      } else if (existing.schemaVersion !== this.schemaVersion) {
        // Migration needed
        const migrated = await this.runMigrations(existing);
        await this.save(migrated.data, 'Schema migration');
        console.log(`[ConfigManager] Migrated from v${existing.schemaVersion} to v${this.schemaVersion}`);
      } else {
        console.log('[ConfigManager] Loaded existing configuration');
      }
    } catch (error) {
      errorHandler.handle(error as Error, 'Configuration initialization failed');
      throw error;
    }
  }

  /**
   * Get configuration value by key
   */
  async get<T = any>(key: string): Promise<T | undefined> {
    const config = await this.load();
    return config?.data[key] as T;
  }

  /**
   * Get all configuration
   */
  async getAll(): Promise<Record<string, any>> {
    const config = await this.load();
    return config?.data || {};
  }

  /**
   * Set configuration value
   */
  async set(key: string, value: any, reason?: string): Promise<void> {
    try {
      // Validate value
      if (this.validationRules.has(key)) {
        const rule = this.validationRules.get(key)!;
        if (!rule.validate(value)) {
          throw new Error(rule.errorMessage);
        }
      }

      const config = await this.load();
      const previousData = { ...config?.data };
      const newData = { ...config?.data, [key]: value };

      await this.save(newData, reason || `Updated ${key}`);
      
      // Save to history
      await this.saveHistory(key, value, previousData);

      eventBus.emit(AppEvents.SETTINGS_CHANGED, { key, value, previousValue: previousData[key] });
    } catch (error) {
      errorHandler.handle(error as Error, `Failed to set configuration: ${key}`);
      throw error;
    }
  }

  /**
   * Set multiple configuration values at once
   */
  async setMany(updates: Record<string, any>, reason?: string): Promise<void> {
    try {
      // Validate all values first
      for (const [key, value] of Object.entries(updates)) {
        if (this.validationRules.has(key)) {
          const rule = this.validationRules.get(key)!;
          if (!rule.validate(value)) {
            throw new Error(`${key}: ${rule.errorMessage}`);
          }
        }
      }

      const config = await this.load();
      const previousData = { ...config?.data };
      const newData = { ...config?.data, ...updates };

      await this.save(newData, reason || 'Bulk update');
      
      // Save to history
      await this.saveHistory('__bulk__', updates, previousData);

      eventBus.emit(AppEvents.SETTINGS_CHANGED, { updates, previousData });
    } catch (error) {
      errorHandler.handle(error as Error, 'Failed to set multiple configurations');
      throw error;
    }
  }

  /**
   * Delete configuration value
   */
  async delete(key: string, reason?: string): Promise<void> {
    const config = await this.load();
    const previousData = { ...config?.data };
    const newData = { ...config?.data };
    delete newData[key];

    await this.save(newData, reason || `Deleted ${key}`);
    await this.saveHistory(key, undefined, previousData);

    eventBus.emit(AppEvents.SETTINGS_CHANGED, { key, deleted: true });
  }

  /**
   * Check if configuration key exists
   */
  async has(key: string): Promise<boolean> {
    const config = await this.load();
    return config?.data.hasOwnProperty(key) || false;
  }

  /**
   * Clear all configuration (use with caution!)
   */
  async clear(reason = 'Configuration cleared'): Promise<void> {
    const config = await this.load();
    await this.saveHistory('__clear__', {}, config?.data || {});
    
    localStorage.removeItem(this.getStorageKey());
    
    eventBus.emit(AppEvents.SETTINGS_CHANGED, { cleared: true });
    console.warn('[ConfigManager] All configuration cleared:', reason);
  }

  /**
   * Get configuration history
   */
  async getHistory(limit?: number): Promise<ConfigHistory[]> {
    const historyKey = `${this.storagePrefix}-history`;
    const stored = localStorage.getItem(historyKey);
    
    if (!stored) return [];
    
    try {
      const history = JSON.parse(stored) as ConfigHistory[];
      return limit ? history.slice(-limit) : history;
    } catch {
      return [];
    }
  }

  /**
   * Restore configuration from history entry
   */
  async restoreFromHistory(historyId: string, reason = 'Restored from history'): Promise<void> {
    const history = await this.getHistory();
    const entry = history.find(h => h.id === historyId);
    
    if (!entry) {
      throw new Error('History entry not found');
    }

    await this.save(entry.previousData, reason);
    console.log('[ConfigManager] Restored from history:', historyId);
  }

  /**
   * Export configuration to JSON
   */
  async export(): Promise<string> {
    const config = await this.load();
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  async import(jsonString: string, reason = 'Configuration imported'): Promise<void> {
    try {
      const imported = JSON.parse(jsonString) as ConfigSchema;
      
      // Validate schema version
      if (imported.schemaVersion > this.schemaVersion) {
        throw new Error('Cannot import configuration from newer version');
      }

      // Run migrations if needed
      let data = imported.data;
      if (imported.schemaVersion < this.schemaVersion) {
        const migrated = await this.runMigrations(imported);
        data = migrated.data;
      }

      await this.save(data, reason);
      console.log('[ConfigManager] Configuration imported successfully');
    } catch (error) {
      errorHandler.handle(error as Error, 'Configuration import failed');
      throw error;
    }
  }

  /**
   * Create backup of current configuration
   */
  async createBackup(): Promise<string> {
    const config = await this.load();
    const backup = {
      ...config,
      backupTimestamp: Date.now(),
      backupId: crypto.randomUUID(),
    };
    
    const backupKey = `${this.storagePrefix}-backup-${backup.backupId}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    
    console.log('[ConfigManager] Backup created:', backup.backupId);
    return backup.backupId;
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: string, reason = 'Restored from backup'): Promise<void> {
    const backupKey = `${this.storagePrefix}-backup-${backupId}`;
    const stored = localStorage.getItem(backupKey);
    
    if (!stored) {
      throw new Error('Backup not found');
    }

    const backup = JSON.parse(stored);
    await this.save(backup.data, reason);
    console.log('[ConfigManager] Restored from backup:', backupId);
  }

  /**
   * List all available backups
   */
  listBackups(): Array<{ id: string; timestamp: number }> {
    const backups: Array<{ id: string; timestamp: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.storagePrefix}-backup-`)) {
        try {
          const backup = JSON.parse(localStorage.getItem(key)!);
          backups.push({
            id: backup.backupId,
            timestamp: backup.backupTimestamp,
          });
        } catch {
          // Skip invalid backups
        }
      }
    }
    
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete old backups
   */
  cleanupBackups(keepCount = 5): void {
    const backups = this.listBackups();
    const toDelete = backups.slice(keepCount);
    
    toDelete.forEach(backup => {
      const key = `${this.storagePrefix}-backup-${backup.id}`;
      localStorage.removeItem(key);
    });
    
    console.log(`[ConfigManager] Cleaned up ${toDelete.length} old backups`);
  }

  /**
   * Register validation rule for a configuration key
   */
  registerValidation(key: string, validate: (value: any) => boolean, errorMessage: string): void {
    this.validationRules.set(key, { key, validate, errorMessage });
  }

  /**
   * Register schema migration
   */
  registerMigration(migration: ConfigMigration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.fromVersion - b.fromVersion);
  }

  /**
   * Get configuration statistics
   */
  async getStats() {
    const config = await this.load();
    const history = await this.getHistory();
    const backups = this.listBackups();
    
    return {
      version: config?.version,
      schemaVersion: config?.schemaVersion,
      keysCount: Object.keys(config?.data || {}).length,
      historySize: history.length,
      backupsCount: backups.length,
      lastModified: config?.metadata?.lastModified,
      storageSize: this.getStorageSize(),
    };
  }

  /**
   * Load configuration from storage
   */
  private async load(): Promise<ConfigSchema | null> {
    const stored = localStorage.getItem(this.getStorageKey());
    
    if (!stored) return null;
    
    try {
      return JSON.parse(stored) as ConfigSchema;
    } catch (error) {
      errorHandler.handle(error as Error, 'Failed to parse configuration');
      return null;
    }
  }

  /**
   * Save configuration to storage
   */
  private async save(data: Record<string, any>, changeReason?: string): Promise<void> {
    const config: ConfigSchema = {
      version: this.currentVersion,
      schemaVersion: this.schemaVersion,
      timestamp: Date.now(),
      data,
      metadata: {
        lastModified: Date.now(),
        changeReason,
      },
    };

    localStorage.setItem(this.getStorageKey(), JSON.stringify(config));
  }

  /**
   * Save to history
   */
  private async saveHistory(key: string, value: any, previousData: Record<string, any>): Promise<void> {
    const historyKey = `${this.storagePrefix}-history`;
    const history = await this.getHistory();

    const entry: ConfigHistory = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      version: this.currentVersion,
      changes: { [key]: value },
      previousData,
    };

    history.push(entry);

    // Keep only last N entries
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
  }

  /**
   * Run migrations
   */
  private async runMigrations(config: ConfigSchema): Promise<ConfigSchema> {
    let data = { ...config.data };
    let currentVersion = config.schemaVersion;

    while (currentVersion < this.schemaVersion) {
      const migration = this.migrations.find(m => m.fromVersion === currentVersion);
      
      if (!migration) {
        throw new Error(`No migration path from version ${currentVersion} to ${this.schemaVersion}`);
      }

      data = migration.migrate(data);
      currentVersion = migration.toVersion;
    }

    return {
      ...config,
      schemaVersion: this.schemaVersion,
      data,
    };
  }

  /**
   * Get storage key
   */
  private getStorageKey(): string {
    return `${this.storagePrefix}-current`;
  }

  /**
   * Calculate storage size
   */
  private getStorageSize(): number {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.storagePrefix)) {
        const value = localStorage.getItem(key);
        size += (key.length + (value?.length || 0)) * 2; // UTF-16 encoding
      }
    }
    return size; // bytes
  }
}

// Singleton instance
export const configManager = new ConfigurationManager();
