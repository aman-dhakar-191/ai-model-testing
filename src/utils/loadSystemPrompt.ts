/**
 * Loads and enhances the system prompt with tool usage guide
 */

/**
 * Fetches the tool usage guide from local or GitHub
 */
async function fetchToolUsageGuide(): Promise<string | null> {
  // Try to fetch from public directory (works in both dev and production)
  try {
    const response = await fetch('/instruction-guides/tool-usage-guide.md');
    if (response.ok) {
      const content = await response.text();
      console.log('✅ Loaded tool-usage-guide.md from public directory');
      return content;
    }
  } catch (error) {
    console.warn('Failed to read tool-usage-guide from public directory:', error);
  }

  // Fallback to GitHub (for web builds or if local fails)
  try {
    const REPO_BASE = 'https://raw.githubusercontent.com/aman-dhakar-191/ai-model-testing/main/instruction-guides';
    const response = await fetch(`${REPO_BASE}/tool-usage-guide.md`);
    if (response.ok) {
      const content = await response.text();
      console.log('✅ Loaded tool-usage-guide.md from GitHub');
      return content;
    }
  } catch (error) {
    console.warn('Failed to fetch tool-usage-guide from GitHub:', error);
  }

  return null;
}

/**
 * Enhances the base system prompt with the tool usage guide
 */
export async function loadEnhancedSystemPrompt(basePrompt: string): Promise<string> {
  try {
    const toolGuide = await fetchToolUsageGuide();
    
    if (!toolGuide) {
      console.warn('⚠️ Tool usage guide not loaded, using base system prompt only');
      return basePrompt;
    }

    // Append the tool guide to the system prompt
    const enhancedPrompt = `${basePrompt}\n\n=== COMPLETE TOOL REFERENCE (AUTO-LOADED) ===\n\n${toolGuide}`;
    
    console.log('✅ System prompt enhanced with tool-usage-guide.md');
    return enhancedPrompt;
  } catch (error) {
    console.error('❌ Failed to load tool usage guide:', error);
    return basePrompt;
  }
}
