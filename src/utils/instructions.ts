import type { ToolDefinition } from '../types';
import { errorHandler } from '../services/ErrorHandler';

const REPO_BASE = 'https://raw.githubusercontent.com/aman-dhakar-191/ai-model-testing/main/instruction-guides';

export const INSTRUCTION_TOOLS: ToolDefinition[] = [
  {
    id: 'builtin-list-instructions',
    name: 'list_instructions',
    description: 'Lists all available instruction guides from the repository. Call this first to discover what guides are available before fetching specific ones.',
    parameters: {},
    required: [],
  },
  {
    id: 'builtin-fetch-instruction',
    name: 'fetch_instruction',
    description: 'Fetches the content of a specific instruction guide by its ID. Use list_instructions first to see available guides, then fetch the ones relevant to the current task.',
    parameters: {
      guide_id: {
        type: 'string',
        description: 'The ID of the instruction guide to fetch (e.g. "apex-best-practices", "pmd-rules", "lwc-standards", "project-structure")',
      },
    },
    required: ['guide_id'],
  },
];

interface GuideIndex {
  id: string;
  filename: string;
  title: string;
  description: string;
}

/**
 * Instruction Service - Manages instruction guide fetching with caching
 */
class InstructionService {
  private cachedIndex: GuideIndex[] | null = null;
  private cacheTimestamp: number = 0;
  private cacheMaxAge = 5 * 60 * 1000; // 5 minutes

  async fetchIndex(): Promise<GuideIndex[]> {
    // Check cache validity
    if (this.cachedIndex && Date.now() - this.cacheTimestamp < this.cacheMaxAge) {
      return this.cachedIndex;
    }

    try {
      const res = await fetch(`${REPO_BASE}/index.json`);
      if (!res.ok) {
        throw new Error(`Failed to fetch instruction index: ${res.status}`);
      }
      
      this.cachedIndex = await res.json();
      this.cacheTimestamp = Date.now();
      return this.cachedIndex!;
    } catch (error) {
      errorHandler.handleApiError(error instanceof Error ? error : String(error), true);
      throw error;
    }
  }

  async listInstructions(): Promise<string> {
    try {
      const index = await this.fetchIndex();
      return JSON.stringify({
        available_guides: index.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
        })),
        usage: 'Call fetch_instruction with a guide_id to load the full guide content.',
        cached: this.cacheTimestamp > 0,
      });
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to list instructions',
      });
    }
  }

  async fetchInstruction(guideId: string): Promise<string> {
    try {
      if (!guideId) {
        return JSON.stringify({ error: 'guide_id is required' });
      }

      const index = await this.fetchIndex();
      const guide = index.find((g) => g.id === guideId);
      
      if (!guide) {
        return JSON.stringify({
          error: `Guide "${guideId}" not found`,
          available: index.map((g) => g.id),
        });
      }

      const res = await fetch(`${REPO_BASE}/${guide.filename}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch guide: ${res.status}`);
      }

      const content = await res.text();
      return JSON.stringify({
        guide_id: guide.id,
        title: guide.title,
        content,
      });
    } catch (error) {
      errorHandler.handleApiError(error instanceof Error ? error : String(error), true);
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch instruction',
      });
    }
  }

  clearCache(): void {
    this.cachedIndex = null;
    this.cacheTimestamp = 0;
  }
}

// Singleton instance
const instructionService = new InstructionService();

/**
 * Execute instruction tool with improved error handling
 */
export async function executeInstructionTool(name: string, argsJson: string): Promise<string> {
  switch (name) {
    case 'list_instructions':
      return await instructionService.listInstructions();

    case 'fetch_instruction': {
      try {
        const args = JSON.parse(argsJson);
        const guideId = args.guide_id as string;
        return await instructionService.fetchInstruction(guideId);
      } catch (error) {
        errorHandler.handleToolError(name, error instanceof Error ? error : String(error), false);
        return JSON.stringify({
          error: error instanceof Error ? error.message : 'Failed to parse arguments',
        });
      }
    }

    default:
      return JSON.stringify({ error: `Unknown instruction tool: ${name}` });
  }
}

export function isInstructionTool(name: string): boolean {
  return name === 'list_instructions' || name === 'fetch_instruction';
}
