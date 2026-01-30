import { Download, FileJson, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Chat } from '../types';
import { exportAsJSON, exportAsMarkdown } from '../utils/export';

interface ExportMenuProps {
  chat: Chat | null;
}

export default function ExportMenu({ chat }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!chat || chat.messages.length === 0) return null;

  return (
    <div className="export-menu" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(!open)} title="Export chat">
        <Download size={18} />
      </button>
      {open && (
        <div className="export-dropdown">
          <button
            onClick={() => {
              exportAsJSON(chat);
              setOpen(false);
            }}
          >
            <FileJson size={16} /> Export JSON
          </button>
          <button
            onClick={() => {
              exportAsMarkdown(chat);
              setOpen(false);
            }}
          >
            <FileText size={16} /> Export Markdown
          </button>
        </div>
      )}
    </div>
  );
}
