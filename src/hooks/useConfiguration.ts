/**
 * React Hook for Configuration Management
 * Provides reactive access to configuration values
 */

import { useState, useEffect, useCallback } from 'react';
import { configManager } from '../services/ConfigurationManager';
import { eventBus, AppEvents } from '../services/EventBus';

/**
 * Hook to access and modify a configuration value
 */
export function useConfig<T = any>(key: string, defaultValue?: T) {
  const [value, setValue] = useState<T | undefined>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        setLoading(true);
        const configValue = await configManager.get<T>(key);
        setValue(configValue !== undefined ? configValue : defaultValue);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setValue(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    loadValue();
  }, [key, defaultValue]);

  // Subscribe to changes
  useEffect(() => {
    const subscription = eventBus.on(AppEvents.SETTINGS_CHANGED, async (data: any) => {
      if (data.key === key || data.updates?.[key] !== undefined) {
        const newValue = await configManager.get<T>(key);
        setValue(newValue !== undefined ? newValue : defaultValue);
      }
    });

    return () => subscription.unsubscribe();
  }, [key, defaultValue]);

  // Update value
  const updateValue = useCallback(
    async (newValue: T, reason?: string) => {
      try {
        await configManager.set(key, newValue, reason);
        setValue(newValue);
        setError(null);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [key],
  );

  // Delete value
  const deleteValue = useCallback(
    async (reason?: string) => {
      try {
        await configManager.delete(key, reason);
        setValue(defaultValue);
        setError(null);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [key, defaultValue],
  );

  return {
    value,
    updateValue,
    deleteValue,
    loading,
    error,
  };
}

/**
 * Hook to access all configuration
 */
export function useAllConfig() {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load all config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const allConfig = await configManager.getAll();
        setConfig(allConfig);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Subscribe to changes
  useEffect(() => {
    const subscription = eventBus.on(AppEvents.SETTINGS_CHANGED, async () => {
      const allConfig = await configManager.getAll();
      setConfig(allConfig);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update multiple values
  const updateMany = useCallback(async (updates: Record<string, any>, reason?: string) => {
    try {
      await configManager.setMany(updates, reason);
      setError(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    config,
    updateMany,
    loading,
    error,
  };
}

/**
 * Hook for configuration history
 */
export function useConfigHistory(limit = 20) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const hist = await configManager.getHistory(limit);
      setHistory(hist);
      setLoading(false);
    };

    loadHistory();

    // Refresh on settings change
    const subscription = eventBus.on(AppEvents.SETTINGS_CHANGED, loadHistory);
    return () => subscription.unsubscribe();
  }, [limit]);

  const restore = useCallback(async (historyId: string, reason?: string) => {
    await configManager.restoreFromHistory(historyId, reason);
  }, []);

  return { history, restore, loading };
}

/**
 * Hook for configuration backups
 */
export function useConfigBackups() {
  const [backups, setBackups] = useState<Array<{ id: string; timestamp: number }>>([]);

  const refresh = useCallback(() => {
    const allBackups = configManager.listBackups();
    setBackups(allBackups);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createBackup = useCallback(async () => {
    const backupId = await configManager.createBackup();
    refresh();
    return backupId;
  }, [refresh]);

  const restoreBackup = useCallback(
    async (backupId: string, reason?: string) => {
      await configManager.restoreBackup(backupId, reason);
      refresh();
    },
    [refresh],
  );

  const cleanup = useCallback(
    (keepCount = 5) => {
      configManager.cleanupBackups(keepCount);
      refresh();
    },
    [refresh],
  );

  return {
    backups,
    createBackup,
    restoreBackup,
    cleanup,
    refresh,
  };
}

/**
 * Hook for configuration stats
 */
export function useConfigStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const configStats = await configManager.getStats();
    setStats(configStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    const subscription = eventBus.on(AppEvents.SETTINGS_CHANGED, refresh);
    return () => subscription.unsubscribe();
  }, [refresh]);

  return { stats, refresh, loading };
}
