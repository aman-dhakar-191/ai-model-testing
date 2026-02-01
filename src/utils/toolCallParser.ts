/**
 * Parser for XML-based tool calls embedded in content
 */

export interface ParsedToolCall {
  name: string;
  arguments: string;
  startIndex: number;
  endIndex: number;
  fullText: string;
}

/**
 * Parses XML child elements into a JSON object
 */
function parseXmlToJson(xmlContent: string): string {
  const obj: Record<string, any> = {};
  
  // Match all XML tags: <tagname>content</tagname>
  const tagRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;
  
  while ((match = tagRegex.exec(xmlContent)) !== null) {
    const tagName = match[1];
    const tagContent = match[2].trim();
    
    // Skip tool_name as it's handled separately
    if (tagName === 'tool_name') continue;
    
    // Try to parse nested XML
    if (tagContent.includes('<') && tagContent.includes('>')) {
      // Has nested tags, recursively parse
      obj[tagName] = JSON.parse(parseXmlToJson(tagContent));
    } else {
      // Simple value
      obj[tagName] = tagContent;
    }
  }
  
  return JSON.stringify(obj);
}

/**
 * Checks if content has an unclosed tool_call tag
 */
export function hasUncompletedToolCall(content: string): boolean {
  const opens = (content.match(/<tool_call>/gi) || []).length;
  const closes = (content.match(/<\/tool_call>/gi) || []).length;
  return opens > closes;
}

/**
 * Extracts completed tool calls from content
 */
export function extractToolCalls(content: string): ParsedToolCall[] {
  const toolCalls: ParsedToolCall[] = [];
  const regex = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const fullText = match[0];
    const innerContent = match[1];
    
    // Extract tool name
    const nameMatch = innerContent.match(/<tool_name>(.*?)<\/tool_name>/i);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();
    
    // Parse remaining XML elements as arguments
    const args = parseXmlToJson(innerContent);
    
    toolCalls.push({
      name,
      arguments: args,
      startIndex: match.index,
      endIndex: match.index + fullText.length,
      fullText,
    });
  }

  return toolCalls;
}

/**
 * Removes tool call tags from content, leaving only visible text
 */
export function removeToolCalls(content: string): string {
  return content.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '').trim();
}

/**
 * Gets the content before any incomplete tool call
 */
export function getContentBeforeIncompleteToolCall(content: string): string {
  const lastOpen = content.lastIndexOf('<tool_call>');
  const lastClose = content.lastIndexOf('</tool_call>');
  
  if (lastOpen > lastClose) {
    // There's an incomplete tool call, return content before it
    return content.substring(0, lastOpen);
  }
  
  return content;
}
