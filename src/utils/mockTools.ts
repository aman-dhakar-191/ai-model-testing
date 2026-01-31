import type { ToolDefinition } from '../types';

export const PRESET_TOOLS: ToolDefinition[] = [
  {
    id: 'preset-weather',
    name: 'get_weather',
    description: 'Get the current weather for a given location',
    parameters: {
      location: { type: 'string', description: 'City name, e.g. "San Francisco, CA"' },
      unit: { type: 'string', description: 'Temperature unit', enum: ['celsius', 'fahrenheit'] },
    },
    required: ['location'],
  },
  {
    id: 'preset-search',
    name: 'web_search',
    description: 'Search the web for information',
    parameters: {
      query: { type: 'string', description: 'The search query' },
      num_results: { type: 'number', description: 'Number of results to return (1-10)' },
    },
    required: ['query'],
  },
  {
    id: 'preset-calculate',
    name: 'calculate',
    description: 'Evaluate a mathematical expression',
    parameters: {
      expression: { type: 'string', description: 'The math expression to evaluate, e.g. "2 + 2 * 3"' },
    },
    required: ['expression'],
  },
];

const MOCK_RESPONSES: Record<string, (args: Record<string, unknown>) => string> = {
  get_weather: (args) => {
    const unit = args.unit === 'celsius' ? 'C' : 'F';
    const temp = args.unit === 'celsius' ? 22 : 72;
    return JSON.stringify({
      location: args.location,
      temperature: temp,
      unit: unit,
      condition: 'Partly cloudy',
      humidity: '65%',
      wind: '12 mph NW',
    });
  },
  web_search: (args) => {
    return JSON.stringify({
      query: args.query,
      results: [
        { title: `Top result for "${args.query}"`, url: 'https://example.com/1', snippet: 'This is a mock search result with relevant information...' },
        { title: `Related: ${args.query} guide`, url: 'https://example.com/2', snippet: 'A comprehensive guide covering the topic in detail...' },
      ],
    });
  },
  calculate: (args) => {
    try {
      const expr = String(args.expression).replace(/[^0-9+\-*/().%\s]/g, '');
      const result = new Function(`return (${expr})`)();
      return JSON.stringify({ expression: args.expression, result });
    } catch {
      return JSON.stringify({ expression: args.expression, result: 'Error: invalid expression' });
    }
  },
};

export function executeMockTool(name: string, argsJson: string): string {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(argsJson);
  } catch {
    return JSON.stringify({ error: 'Failed to parse tool arguments' });
  }

  const handler = MOCK_RESPONSES[name];
  if (handler) {
    return handler(args);
  }

  return JSON.stringify({
    tool: name,
    args,
    result: `Mock result for ${name}. This is a simulated response.`,
    status: 'success',
  });
}

export function toolDefinitionsToApiFormat(tools: ToolDefinition[]) {
  return tools
    .filter((t) => t.name && t.name.trim() !== '') // Filter out tools with empty names
    .map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            Object.entries(t.parameters)
              .filter(([, param]) => param.type && param.type.trim() !== '') // Filter out params with empty types
              .map(([key, param]) => [
                key,
                {
                  type: param.type,
                  description: param.description,
                  ...(param.enum ? { enum: param.enum } : {}),
                },
              ]),
          ),
          required: t.required.filter((r) => t.parameters[r] && t.parameters[r].type && t.parameters[r].type.trim() !== ''), // Only include required params that have valid types
        },
      },
    }));
}
