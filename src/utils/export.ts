import type { Chat } from '../types';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsJSON(chat: Chat) {
  const data = {
    title: chat.title,
    model: chat.settings.model,
    systemPrompt: chat.settings.systemPrompt,
    temperature: chat.settings.temperature,
    messages: chat.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp).toISOString(),
      model: m.model,
    })),
    exportedAt: new Date().toISOString(),
  };
  downloadFile(JSON.stringify(data, null, 2), `${chat.title}.json`, 'application/json');
}

export function exportAsMarkdown(chat: Chat) {
  let md = `# ${chat.title}\n\n`;
  md += `**Model:** ${chat.settings.model}\n`;
  md += `**Temperature:** ${chat.settings.temperature}\n`;
  if (chat.settings.systemPrompt) {
    md += `**System Prompt:** ${chat.settings.systemPrompt}\n`;
  }
  md += `\n---\n\n`;

  for (const msg of chat.messages) {
    const time = new Date(msg.timestamp).toLocaleString();
    if (msg.role === 'user') {
      md += `### User (${time})\n\n${msg.content}\n\n`;
    } else if (msg.role === 'assistant') {
      md += `### Assistant (${time})\n\n${msg.content}\n\n`;
    }
  }

  downloadFile(md, `${chat.title}.md`, 'text/markdown');
}
