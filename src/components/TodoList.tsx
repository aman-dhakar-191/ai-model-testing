import { useState } from 'react';
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import type { TodoItem } from '../types';

interface TodoListProps {
  todos?: TodoItem[];
}

export default function TodoList({ todos = [] }: TodoListProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasTodos = todos.length > 0;

  const getStatusIcon = (status: TodoItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'in-progress':
        return <Clock size={16} className="text-blue-500" />;
      case 'pending':
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };

  const getStatusClass = (status: TodoItem['status']) => {
    switch (status) {
      case 'completed':
        return 'todo-completed';
      case 'in-progress':
        return 'todo-in-progress';
      case 'pending':
      default:
        return 'todo-pending';
    }
  };

  return (
    <div className="todo-list">
      <button 
        className="todo-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand tasks' : 'Collapse tasks'}
      >
        <div className="todo-header-left">
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <h3>Tasks</h3>
        </div>
        <span className="todo-count">{todos.length}</span>
      </button>
      {!isCollapsed && (
        hasTodos ? (
          <div className="todo-items">
            {todos.map((todo) => (
              <div key={todo.id} className={`todo-item ${getStatusClass(todo.status)}`}>
                <div className="todo-icon">{getStatusIcon(todo.status)}</div>
                <div className="todo-content">
                  <div className="todo-title">{todo.title}</div>
                  <div className="todo-status">{todo.status.replace('-', ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="todo-empty">No tasks yet.</div>
        )
      )}
    </div>
  );
}
