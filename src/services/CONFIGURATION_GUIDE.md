# Configuration Management System

## Overview

Enterprise-grade persistent configuration management with versioning, validation, history tracking, and backup/restore capabilities.

## Features

✅ **Persistent Storage** - localStorage-based with automatic serialization  
✅ **Version Control** - Track all configuration changes with history  
✅ **Schema Migrations** - Seamless upgrades between versions  
✅ **Validation** - Type-safe validation rules  
✅ **Backup/Restore** - Create and restore configuration snapshots  
✅ **Import/Export** - JSON-based configuration portability  
✅ **History Tracking** - Full audit trail of changes  
✅ **React Hooks** - Reactive configuration access  

---

## Quick Start

### Initialize Configuration

```typescript
import { configManager } from './services';

// Initialize with defaults
await configManager.initialize({
  apiKey: '',
  model: 'gpt-4',
  temperature: 0.7,
  theme: 'dark',
});
```

### Using React Hooks

```typescript
import { useConfig } from './hooks/useConfiguration';

function MyComponent() {
  const { value, updateValue, loading } = useConfig('theme', 'dark');
  
  const handleChange = async (newTheme: string) => {
    await updateValue(newTheme, 'User changed theme');
  };
  
  if (loading) return <div>Loading...</div>;
  
  return <div>Current theme: {value}</div>;
}
```

---

## Core API

### Get Configuration

```typescript
// Single value
const apiKey = await configManager.get('apiKey');

// All values
const allConfig = await configManager.getAll();

// Check existence
if (await configManager.has('apiKey')) {
  // ...
}
```

### Set Configuration

```typescript
// Single value
await configManager.set('apiKey', 'sk-...', 'API key updated');

// Multiple values
await configManager.setMany({
  model: 'gpt-4',
  temperature: 0.8,
}, 'Bulk settings update');

// Delete value
await configManager.delete('apiKey', 'API key removed');
```

### Validation

```typescript
// Register validation rule
configManager.registerValidation(
  'temperature',
  (value) => value >= 0 && value <= 2,
  'Temperature must be between 0 and 2'
);

// Now this will throw an error
await configManager.set('temperature', 3); // Error: Temperature must be between 0 and 2
```

---

## History & Versioning

### View History

```typescript
// Get recent changes
const history = await configManager.getHistory(10);

history.forEach(entry => {
  console.log(`${entry.timestamp}: ${entry.changes}`);
});
```

### Restore from History

```typescript
// Get history
const history = await configManager.getHistory();
const lastEntry = history[history.length - 1];

// Restore
await configManager.restoreFromHistory(lastEntry.id, 'Undo last change');
```

### Using React Hook

```typescript
import { useConfigHistory } from './hooks/useConfiguration';

function HistoryViewer() {
  const { history, restore, loading } = useConfigHistory(20);
  
  return (
    <div>
      {history.map(entry => (
        <div key={entry.id}>
          <span>{new Date(entry.timestamp).toLocaleString()}</span>
          <button onClick={() => restore(entry.id)}>Restore</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Backup & Restore

### Create Backup

```typescript
// Create backup
const backupId = await configManager.createBackup();
console.log('Backup created:', backupId);

// List backups
const backups = configManager.listBackups();
backups.forEach(backup => {
  console.log(`${backup.id} - ${new Date(backup.timestamp).toLocaleString()}`);
});
```

### Restore Backup

```typescript
// Restore specific backup
await configManager.restoreBackup(backupId, 'Restored from backup');

// Cleanup old backups (keep last 5)
configManager.cleanupBackups(5);
```

### Using React Hook

```typescript
import { useConfigBackups } from './hooks/useConfiguration';

function BackupManager() {
  const { backups, createBackup, restoreBackup, cleanup } = useConfigBackups();
  
  return (
    <div>
      <button onClick={createBackup}>Create Backup</button>
      <button onClick={() => cleanup(5)}>Cleanup Old Backups</button>
      
      {backups.map(backup => (
        <div key={backup.id}>
          <span>{new Date(backup.timestamp).toLocaleString()}</span>
          <button onClick={() => restoreBackup(backup.id)}>Restore</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Import & Export

### Export Configuration

```typescript
// Export as JSON
const json = await configManager.export();

// Save to file or send to server
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
```

### Import Configuration

```typescript
// Import from JSON string
const jsonString = await file.text();
await configManager.import(jsonString, 'Configuration imported from file');
```

---

## Schema Migrations

### Register Migration

```typescript
configManager.registerMigration({
  fromVersion: 1,
  toVersion: 2,
  migrate: (data) => {
    // Transform data structure
    return {
      ...data,
      newField: 'default value',
      renamedField: data.oldField,
    };
  },
});
```

Migrations run automatically when loading older configurations.

---

## React Hooks

### useConfig

Get and update a single configuration value:

```typescript
const { value, updateValue, deleteValue, loading, error } = useConfig('apiKey', '');
```

### useAllConfig

Get and update all configuration:

```typescript
const { config, updateMany, loading, error } = useAllConfig();
```

### useConfigHistory

Access configuration history:

```typescript
const { history, restore, loading } = useConfigHistory(20);
```

### useConfigBackups

Manage backups:

```typescript
const { backups, createBackup, restoreBackup, cleanup } = useConfigBackups();
```

### useConfigStats

View statistics:

```typescript
const { stats, refresh, loading } = useConfigStats();

// stats contains:
// - version
// - schemaVersion
// - keysCount
// - historySize
// - backupsCount
// - lastModified
// - storageSize
```

---

## Statistics

```typescript
const stats = await configManager.getStats();

console.log(`Configuration version: ${stats.version}`);
console.log(`Keys: ${stats.keysCount}`);
console.log(`History entries: ${stats.historySize}`);
console.log(`Backups: ${stats.backupsCount}`);
console.log(`Storage size: ${stats.storageSize} bytes`);
```

---

## Advanced Usage

### Automatic Backups

```typescript
// Create backup before important operations
const backupId = await configManager.createBackup();

try {
  await configManager.setMany(newSettings);
} catch (error) {
  // Restore on error
  await configManager.restoreBackup(backupId);
  throw error;
}
```

### Configuration Presets

```typescript
const presets = {
  development: {
    apiKey: 'dev-key',
    model: 'gpt-3.5-turbo',
    temperature: 0.5,
  },
  production: {
    apiKey: 'prod-key',
    model: 'gpt-4',
    temperature: 0.7,
  },
};

// Load preset
await configManager.setMany(presets.production, 'Loaded production preset');
```

### Validation Examples

```typescript
// API key validation
configManager.registerValidation(
  'apiKey',
  (value) => typeof value === 'string' && value.startsWith('sk-'),
  'API key must start with sk-'
);

// Model validation
configManager.registerValidation(
  'model',
  (value) => ['gpt-3.5-turbo', 'gpt-4', 'claude-3'].includes(value),
  'Invalid model selected'
);

// Temperature validation
configManager.registerValidation(
  'temperature',
  (value) => typeof value === 'number' && value >= 0 && value <= 2,
  'Temperature must be between 0 and 2'
);
```

---

## Migration Example

```typescript
// Migration from v1 to v2
configManager.registerMigration({
  fromVersion: 1,
  toVersion: 2,
  migrate: (data) => {
    // Rename field
    const newData = { ...data };
    newData.modelName = data.model;
    delete newData.model;
    
    // Add new fields
    newData.provider = 'openrouter';
    newData.timeout = 30000;
    
    return newData;
  },
});

// Migration from v2 to v3
configManager.registerMigration({
  fromVersion: 2,
  toVersion: 3,
  migrate: (data) => {
    // Split settings into categories
    return {
      ...data,
      ui: {
        theme: data.theme,
        language: data.language,
      },
      api: {
        provider: data.provider,
        timeout: data.timeout,
      },
    };
  },
});
```

---

## Best Practices

1. **Always provide reasons** for changes
2. **Register validations** for critical settings
3. **Create backups** before major changes
4. **Cleanup old backups** periodically
5. **Use migrations** for schema changes
6. **Export configuration** for disaster recovery
7. **Monitor storage size** to avoid quota issues

---

## Storage Limits

localStorage typically has a 5-10MB limit per domain. Monitor usage:

```typescript
const stats = await configManager.getStats();
const sizeInMB = stats.storageSize / 1024 / 1024;

if (sizeInMB > 5) {
  // Cleanup old history/backups
  configManager.cleanupBackups(3);
}
```

---

## Integration with Existing Code

Replace `useLocalStorage` with `useConfig`:

```typescript
// Before
const [apiKey, setApiKey] = useLocalStorage('api-key', '');

// After
const { value: apiKey, updateValue: setApiKey } = useConfig('apiKey', '');
```

---

## Complete Example

```typescript
import { configManager } from './services';
import { useConfig, useConfigBackups } from './hooks/useConfiguration';

// Initialize on app start
async function initializeApp() {
  // Register validations
  configManager.registerValidation(
    'apiKey',
    (value) => value.length > 0,
    'API key is required'
  );
  
  // Initialize with defaults
  await configManager.initialize({
    apiKey: '',
    model: 'gpt-4',
    temperature: 0.7,
    systemPrompt: '',
  });
  
  // Create initial backup
  await configManager.createBackup();
}

// Use in component
function Settings() {
  const { value: apiKey, updateValue: setApiKey } = useConfig('apiKey', '');
  const { createBackup } = useConfigBackups();
  
  const handleSave = async () => {
    // Create backup before changes
    await createBackup();
    
    // Update settings
    await setApiKey(newApiKey, 'User updated API key');
  };
  
  return (
    <input 
      value={apiKey} 
      onChange={(e) => handleSave(e.target.value)} 
    />
  );
}
```

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready
