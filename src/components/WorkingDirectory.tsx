import { useState, useEffect } from 'react';
import { Folder, RefreshCw } from 'lucide-react';

export default function WorkingDirectory() {
  const [workingDir, setWorkingDir] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadWorkingDirectory = async () => {
    if (typeof window !== 'undefined' && (window as any).electron?.salesforce?.getWorkingDirectory) {
      try {
        const dir = await (window as any).electron.salesforce.getWorkingDirectory();
        setWorkingDir(dir);
      } catch (error) {
        console.error('Failed to get working directory:', error);
      }
    }
  };

  useEffect(() => {
    loadWorkingDirectory();
  }, []);

  const handleSelectFolder = async () => {
    if (typeof window !== 'undefined' && (window as any).electron?.salesforce?.selectFolder) {
      try {
        setLoading(true);
        const newDir = await (window as any).electron.salesforce.selectFolder();
        if (newDir) {
          setWorkingDir(newDir);
        }
      } catch (error) {
        console.error('Failed to select folder:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!workingDir) return null;

  return (
    <div className="working-directory">
      <div className="working-directory-content">
        <Folder size={16} />
        <span className="working-directory-path" title={workingDir}>
          {workingDir}
        </span>
        <button
          className="working-directory-button"
          onClick={handleSelectFolder}
          disabled={loading}
          title="Change project folder"
        >
          {loading ? <RefreshCw size={14} className="spinning" /> : <RefreshCw size={14} />}
        </button>
      </div>
    </div>
  );
}
