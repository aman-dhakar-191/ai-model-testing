/**
 * Tool instruction for web_fetch
 */

export const WEB_FETCH_PROMPT = `### web_fetch
Fetches content from a URL.

**When to use:** Getting external documentation or API data

**Parameters:**
- \`url\` (string) - URL to fetch
- \`method\` (string, optional) - "GET" | "POST" | "PUT" | "DELETE"
- \`headers\` (object, optional) - HTTP headers
- \`body\` (string, optional) - Request body`;
