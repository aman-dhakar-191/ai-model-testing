/**
 * Event Bus - Pub/Sub pattern for cross-component communication
 * Reduces tight coupling between components
 */

type EventCallback<T = any> = (data: T) => void;

interface EventSubscription {
  unsubscribe: () => void;
}

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   */
  on<T = any>(event: string, callback: EventCallback<T>): EventSubscription {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    return {
      unsubscribe: () => this.off(event, callback),
    };
  }

  /**
   * Subscribe to an event once (auto-unsubscribe after first call)
   */
  once<T = any>(event: string, callback: EventCallback<T>): EventSubscription {
    const wrappedCallback = (data: T) => {
      callback(data);
      this.off(event, wrappedCallback);
    };
    return this.on(event, wrappedCallback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event
   */
  emit<T = any>(event: string, data?: T): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Remove all subscribers for an event
   */
  clear(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get subscriber count for an event
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.size ?? 0;
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Event types for type safety
export const AppEvents = {
  TOOL_EXECUTION_START: 'tool:execution:start',
  TOOL_EXECUTION_SUCCESS: 'tool:execution:success',
  TOOL_EXECUTION_ERROR: 'tool:execution:error',
  TOOL_EXECUTION_COMPLETE: 'tool:execution:complete',
  
  CHAT_MESSAGE_SENT: 'chat:message:sent',
  CHAT_MESSAGE_RECEIVED: 'chat:message:received',
  CHAT_CREATED: 'chat:created',
  CHAT_DELETED: 'chat:deleted',
  CHAT_SELECTED: 'chat:selected',
  
  ORG_CHANGED: 'org:changed',
  ORG_LOGIN: 'org:login',
  ORG_LOGOUT: 'org:logout',
  
  WORKING_DIR_CHANGED: 'workingDir:changed',
  PROJECT_SETUP_REQUIRED: 'project:setup:required',
  
  ERROR_OCCURRED: 'error:occurred',
  SETTINGS_CHANGED: 'settings:changed',
} as const;

export type AppEventsType = typeof AppEvents[keyof typeof AppEvents];

export type { EventCallback, EventSubscription };
