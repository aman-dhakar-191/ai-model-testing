import { Plus, Trash2, MessageSquare } from 'lucide-react';
import type { Chat } from '../types';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({ chats, activeChatId, onSelect, onNew, onDelete }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>
        <button className="icon-btn" onClick={onNew} title="New chat">
          <Plus size={18} />
        </button>
      </div>
      <div className="sidebar-list">
        {chats.length === 0 && (
          <p className="sidebar-empty">No chats yet. Start a new one!</p>
        )}
        {chats
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((chat) => (
            <div
              key={chat.id}
              className={`sidebar-item ${chat.id === activeChatId ? 'active' : ''}`}
              onClick={() => onSelect(chat.id)}
            >
              <MessageSquare size={14} />
              <span className="sidebar-item-title">{chat.title}</span>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(chat.id);
                }}
                title="Delete chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
      </div>
    </aside>
  );
}
