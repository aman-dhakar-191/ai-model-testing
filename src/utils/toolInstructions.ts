import type { ToolDefinition } from '../types';

/**
 * Tool Instruction Loader
 * Loads detailed markdown instructions for tools and enriches their descriptions
 */

interface InstructionCache {
  content: string;
  timestamp: number;
}

class ToolInstructionLoader {
  private cache = new Map<string, InstructionCache>();
  private cacheMaxAge = 60 * 60 * 1000; // 1 hour

  /**
   * Load instruction content from markdown file
   */
  private async loadInstructionFile(filename: string): Promise<string> {
    // Check if running in Electron environment
    if (typeof window !== 'undefined' && window.electron?.salesforce) {
      try {
        // Use the read_file tool to load the instruction markdown
        const result = await window.electron.salesforce.executeTool(
          'read_file',
          JSON.stringify({ path: `salesforce-tools/${filename}` })
        );
        const parsed = JSON.parse(result);
        if (parsed.status === 'success' && parsed.content) {
          return parsed.content;
        }
      } catch (error) {
        console.warn(`Failed to load instruction file ${filename}:`, error);
      }
    }
    return '';
  }

  /**
   * Get instruction content with caching
   */
  private async getInstructionContent(filename: string): Promise<string> {
    const cached = this.cache.get(filename);
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return cached.content;
    }

    const content = await this.loadInstructionFile(filename);
    if (content) {
      this.cache.set(filename, {
        content,
        timestamp: Date.now(),
      });
    }

    return content;
  }

  /**
   * Enrich a tool definition with detailed instructions
   */
  async enrichToolDescription(tool: ToolDefinition): Promise<ToolDefinition> {
    if (!tool.instructionFile) {
      return tool;
    }

    const instructions = await this.getInstructionContent(tool.instructionFile);
    if (!instructions) {
      return tool;
    }

    // Create enriched description by combining brief description with detailed instructions
    const enrichedDescription = `${tool.description}\n\n---\nDETAILED USAGE INSTRUCTIONS:\n${instructions}`;

    return {
      ...tool,
      description: enrichedDescription,
    };
  }

  /**
   * Enrich multiple tool definitions
   */
  async enrichToolDefinitions(tools: ToolDefinition[]): Promise<ToolDefinition[]> {
    const enrichedTools = await Promise.all(
      tools.map(tool => this.enrichToolDescription(tool))
    );
    return enrichedTools;
  }

  /**
   * Clear the instruction cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const toolInstructionLoader = new ToolInstructionLoader();
