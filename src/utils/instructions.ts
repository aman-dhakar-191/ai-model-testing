import type { ToolDefinition } from '../types';

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

let cachedIndex: GuideIndex[] | null = null;

async function fetchIndex(): Promise<GuideIndex[]> {
  if (cachedIndex) return cachedIndex;
  const res = await fetch(`${REPO_BASE}/index.json`);
  if (!res.ok) throw new Error(`Failed to fetch instruction index: ${res.status}`);
  cachedIndex = await res.json();
  return cachedIndex!;
}

export async function executeInstructionTool(name: string, argsJson: string): Promise<string> {
  if (name === 'list_instructions') {
    try {
      const index = await fetchIndex();
      return JSON.stringify({
        available_guides: index.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
        })),
        usage: 'Call fetch_instruction with a guide_id to load the full guide content.',
      });
    } catch (e) {
      return JSON.stringify({ error: e instanceof Error ? e.message : 'Failed to list instructions' });
    }
  }

  if (name === 'fetch_instruction') {
    try {
      const args = JSON.parse(argsJson);
      const guideId = args.guide_id as string;
      if (!guideId) {
        return JSON.stringify({ error: 'guide_id is required' });
      }

      const index = await fetchIndex();
      const guide = index.find((g) => g.id === guideId);
      if (!guide) {
        return JSON.stringify({
          error: `Guide "${guideId}" not found`,
          available: index.map((g) => g.id),
        });
      }

      const res = await fetch(`${REPO_BASE}/${guide.filename}`);
      if (!res.ok) {
        return JSON.stringify({ error: `Failed to fetch guide: ${res.status}` });
      }

      const content = await res.text();
      return JSON.stringify({
        guide_id: guide.id,
        title: guide.title,
        content,
      });
    } catch (e) {
      return JSON.stringify({ error: e instanceof Error ? e.message : 'Failed to fetch instruction' });
    }
  }

  return JSON.stringify({ error: `Unknown instruction tool: ${name}` });
}

export function isInstructionTool(name: string): boolean {
  return name === 'list_instructions' || name === 'fetch_instruction';
}
