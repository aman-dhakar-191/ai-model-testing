/**
 * Parses <think>...</think> blocks from model response text.
 * Models like DeepSeek R1, Chimera, etc. emit reasoning in these blocks.
 */
export function parseThinking(content: string): { thinking: string; response: string } {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
  const thinkBlocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = thinkRegex.exec(content)) !== null) {
    const block = match[1].trim();
    if (block) {
      thinkBlocks.push(block);
    }
  }

  const response = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const thinking = thinkBlocks.join('\n\n');

  return { thinking, response };
}

/**
 * Checks if a streaming content string has an unclosed <think> tag,
 * meaning the model is currently in its thinking phase.
 */
export function isCurrentlyThinking(content: string): boolean {
  const opens = (content.match(/<think>/gi) || []).length;
  const closes = (content.match(/<\/think>/gi) || []).length;
  return opens > closes;
}

/**
 * Extracts the current thinking text from streaming content
 * when a <think> block is still open (not yet closed).
 */
export function getStreamingThinking(content: string): { thinking: string; visible: string } {
  const thinking = isCurrentlyThinking(content);

  if (thinking) {
    // Find the last unclosed <think> tag
    const lastOpen = content.lastIndexOf('<think>');
    const beforeThink = content.substring(0, lastOpen).replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const thinkContent = content.substring(lastOpen + 7).trim();
    return { thinking: thinkContent, visible: beforeThink };
  }

  // All think blocks are closed — parse normally
  const parsed = parseThinking(content);
  return { thinking: parsed.thinking, visible: parsed.response };
}
