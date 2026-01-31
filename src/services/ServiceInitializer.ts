/**
 * Service Initialization and Configuration
 * Sets up all services with proper middleware and configuration
 */

import { toolRegistry } from './ToolRegistry';
import { toolMiddleware, loggingMiddleware, eventMiddleware, validationMiddleware, errorHandlingMiddleware, performanceMiddleware, timeoutMiddleware } from './ToolMiddleware';
import { INSTRUCTION_TOOLS, executeInstructionTool } from '../utils/instructions';
import { SALESFORCE_TOOLS, executeSalesforceTool } from '../utils/salesforceToolsRenderer';
import { DEPLOY_TOOLS, executeDeployTool } from '../utils/deployTools';
import type { ToolDefinition } from '../types';

/**
 * Initialize all services and middleware
 */
export function initializeServices() {
  // Setup middleware pipeline (order matters!)
  toolMiddleware.use(validationMiddleware);      // 1. Validate input
  toolMiddleware.use(errorHandlingMiddleware);   // 2. Handle errors
  toolMiddleware.use(eventMiddleware);           // 3. Emit events
  toolMiddleware.use(loggingMiddleware);         // 4. Log execution
  toolMiddleware.use(performanceMiddleware);     // 5. Monitor performance
  toolMiddleware.use(timeoutMiddleware(60000));  // 6. 60s timeout

  // Register built-in tool categories
  registerBuiltInTools();

  console.log('[Services] Initialized successfully');
  console.log('[ToolRegistry] Stats:', toolRegistry.getStats());
}

/**
 * Register all built-in tool categories
 */
function registerBuiltInTools() {
  // Register instruction tools (highest priority)
  toolRegistry.register(
    'instructions',
    'Instruction guide tools for fetching documentation',
    INSTRUCTION_TOOLS,
    executeInstructionTool,
    100,
  );

  // Register Salesforce development tools
  toolRegistry.register(
    'salesforce',
    'Salesforce component creation and file operations',
    SALESFORCE_TOOLS,
    executeSalesforceTool,
    90,
  );

  // Register deployment tools
  toolRegistry.register(
    'deployment',
    'Salesforce metadata deployment and validation',
    DEPLOY_TOOLS,
    executeDeployTool,
    80,
  );
}

/**
 * Register user-defined custom tools
 */
export function registerCustomTools(tools: ToolDefinition[], executor: (name: string, args: string) => Promise<string>) {
  toolRegistry.register(
    'custom',
    'User-defined custom tools',
    tools,
    executor,
    50, // Lower priority than built-in tools
  );
}

/**
 * Unregister custom tools
 */
export function unregisterCustomTools() {
  toolRegistry.unregister('custom');
}

/**
 * Update custom tools (unregister old, register new)
 */
export function updateCustomTools(tools: ToolDefinition[], executor: (name: string, args: string) => Promise<string>) {
  unregisterCustomTools();
  if (tools.length > 0) {
    registerCustomTools(tools, executor);
  }
}

/**
 * Get service health status
 */
export function getServiceHealth() {
  const registryStats = toolRegistry.getStats();
  
  return {
    healthy: true,
    services: {
      toolRegistry: {
        status: 'running',
        categories: registryStats.categoryCount,
        tools: registryStats.toolCount,
      },
      toolMiddleware: {
        status: 'running',
        middlewareCount: toolMiddleware.count(),
      },
    },
    timestamp: Date.now(),
  };
}
