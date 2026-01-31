/**
 * Tool Registry - Dynamic tool management with dependency injection
 * Enables runtime tool registration and discovery
 */

import type { ToolDefinition } from '../types';
import { errorHandler } from './ErrorHandler';

export type ToolExecutor = (name: string, argsJson: string) => Promise<string>;

export interface ToolCategory {
  name: string;
  description: string;
  tools: ToolDefinition[];
  executor: ToolExecutor;
  priority: number;
}

class ToolRegistry {
  private categories: Map<string, ToolCategory> = new Map();
  private toolIndex: Map<string, string> = new Map(); // toolName -> categoryName

  /**
   * Register a tool category
   */
  register(
    categoryName: string,
    description: string,
    tools: ToolDefinition[],
    executor: ToolExecutor,
    priority = 0,
  ): void {
    const category: ToolCategory = {
      name: categoryName,
      description,
      tools,
      executor,
      priority,
    };

    this.categories.set(categoryName, category);

    // Index tools for quick lookup
    tools.forEach((tool) => {
      if (this.toolIndex.has(tool.name)) {
        console.warn(`Tool "${tool.name}" is already registered. Overwriting.`);
      }
      this.toolIndex.set(tool.name, categoryName);
    });
  }

  /**
   * Unregister a tool category
   */
  unregister(categoryName: string): boolean {
    const category = this.categories.get(categoryName);
    if (!category) return false;

    // Remove from index
    category.tools.forEach((tool) => {
      this.toolIndex.delete(tool.name);
    });

    return this.categories.delete(categoryName);
  }

  /**
   * Get all tools across all categories
   */
  getAllTools(): ToolDefinition[] {
    const allTools: ToolDefinition[] = [];
    
    // Sort categories by priority (higher priority first)
    const sortedCategories = Array.from(this.categories.values())
      .sort((a, b) => b.priority - a.priority);

    sortedCategories.forEach((category) => {
      allTools.push(...category.tools);
    });

    return allTools;
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(categoryName: string): ToolDefinition[] {
    return this.categories.get(categoryName)?.tools ?? [];
  }

  /**
   * Get all categories
   */
  getCategories(): ToolCategory[] {
    return Array.from(this.categories.values())
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if a tool exists
   */
  hasTool(toolName: string): boolean {
    return this.toolIndex.has(toolName);
  }

  /**
   * Get tool definition
   */
  getTool(toolName: string): ToolDefinition | undefined {
    const categoryName = this.toolIndex.get(toolName);
    if (!categoryName) return undefined;

    const category = this.categories.get(categoryName);
    return category?.tools.find((t) => t.name === toolName);
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName: string, argsJson: string): Promise<string> {
    const categoryName = this.toolIndex.get(toolName);
    if (!categoryName) {
      const error = `Tool "${toolName}" not found in registry`;
      errorHandler.handleToolError(toolName, error, false);
      return JSON.stringify({ error });
    }

    const category = this.categories.get(categoryName);
    if (!category) {
      const error = `Category "${categoryName}" not found`;
      errorHandler.handleToolError(toolName, error, false);
      return JSON.stringify({ error });
    }

    try {
      return await category.executor(toolName, argsJson);
    } catch (error) {
      const appError = errorHandler.handleToolError(
        toolName,
        error instanceof Error ? error : String(error),
        true,
      );
      return JSON.stringify({
        error: appError.message,
        context: appError.context,
      });
    }
  }

  /**
   * Get tool count
   */
  getToolCount(): number {
    return this.toolIndex.size;
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.categories.clear();
    this.toolIndex.clear();
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      categoryCount: this.categories.size,
      toolCount: this.toolIndex.size,
      categories: Array.from(this.categories.keys()),
    };
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();
