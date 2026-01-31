import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';

interface InstructionEntry {
  guideId: string;
  title: string;
}

interface InstructionsUsedProps {
  instructions: InstructionEntry[];
}

export default function InstructionsUsed({ instructions }: InstructionsUsedProps) {
  const [expanded, setExpanded] = useState(false);

  if (instructions.length === 0) return null;

  return (
    <div className="instructions-used">
      <button className="instructions-used-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <BookOpen size={13} />
        <span className="instructions-used-label">
          Instructions Used ({instructions.length})
        </span>
        {!expanded && (
          <span className="instructions-used-preview">
            {instructions.map((i) => i.title).join(', ')}
          </span>
        )}
      </button>
      {expanded && (
        <div className="instructions-used-list">
          {instructions.map((inst) => (
            <div key={inst.guideId} className="instructions-used-item">
              <BookOpen size={12} />
              <span>{inst.title}</span>
              <span className="instructions-used-id">{inst.guideId}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
