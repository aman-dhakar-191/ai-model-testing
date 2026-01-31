import { useState, useEffect } from 'react';
import { Folder, RefreshCw, Clock, ChevronDown } from 'lucide-react';
import ProjectSetupModal from './ProjectSetupModal';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface RecentProject {
  path: string;
  name: string;
  lastOpened: number;
}

export default function WorkingDirectory() {
  const [workingDir, setWorkingDir] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showRecentProjects, setShowRecentProjects] = useState(false);
  const [recentProjects, setRecentProjects] = useLocalStorage<RecentProject[]>('recent-projects', []);

  const loadWorkingDirectory = async () => {
    if (typeof window !== 'undefined' && (window as any).electron?.salesforce?.getWorkingDirectory) {
      try {
        const dir = await (window as any).electron.salesforce.getWorkingDirectory();
        setWorkingDir(dir);
        addToRecentProjects(dir);
      } catch (error) {
        console.error('Failed to get working directory:', error);
      }
    }
  };

  useEffect(() => {
    loadWorkingDirectory();
  }, []);

  const addToRecentProjects = (projectPath: string) => {
    if (!projectPath) return;

    const projectName = projectPath.split(/[/\\]/).filter(Boolean).pop() || projectPath;
    
    setRecentProjects((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.path !== projectPath);
      
      // Add to front with current timestamp
      const updated = [
        { path: projectPath, name: projectName, lastOpened: Date.now() },
        ...filtered,
      ];
      
      // Keep only last 10 projects
      return updated.slice(0, 10);
    });
  };

  const handleSelectFolder = async () => {
    if (typeof window !== 'undefined' && (window as any).electron?.salesforce?.selectFolder) {
      try {
        setLoading(true);
        const newDir = await (window as any).electron.salesforce.selectFolder();
        if (newDir) {
          setWorkingDir(newDir);
          addToRecentProjects(newDir);
          // Persist the working directory
          await (window as any).electron.salesforce.setWorkingDirectory(newDir);
        }
      } catch (error) {
        console.error('Failed to select folder:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProjectClick = async () => {
    // Check if a project is already open
    if (workingDir) {
      const isProject = await (window as any).electron.sfCli.checkIfSalesforceProject(workingDir);
      if (isProject) {
        const confirmed = confirm(
          `You currently have a Salesforce project open:\n${workingDir}\n\nDo you want to switch to a different project?`
        );
        if (!confirmed) {
          return;
        }
      }
    }
    
    // Open the project setup modal
    setShowProjectModal(true);
  };

  const handleCloseProjectModal = async (options?: { dontShowAgain?: boolean; projectDir?: string }) => {
    setShowProjectModal(false);
    
    if (options?.projectDir) {
      // Add to recent projects
      addToRecentProjects(options.projectDir);
      
      // Update the working directory display
      setWorkingDir(options.projectDir);
      
      // Persist the working directory
      try {
        await (window as any).electron.salesforce.setWorkingDirectory(options.projectDir);
      } catch (error) {
        console.error('Failed to set working directory:', error);
      }
      
      // Reload the page to refresh all components with the new project
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const handleSelectRecentProject = async (projectPath: string) => {
    setShowRecentProjects(false);
    
    // Check if current project is open
    if (workingDir && workingDir !== projectPath) {
      const isProject = await (window as any).electron.sfCli.checkIfSalesforceProject(workingDir);
      if (isProject) {
        const confirmed = confirm(
          `You currently have a Salesforce project open:\n${workingDir}\n\nDo you want to switch to:\n${projectPath}?`
        );
        if (!confirmed) {
          return;
        }
      }
    }

    try {
      setLoading(true);
      
      // Check if the recent project still exists and is valid
      const isValid = await (window as any).electron.sfCli.checkIfSalesforceProject(projectPath);
      
      if (isValid) {
        // Update working directory (this will be handled by electron)
        // For now, we'll reload with the new path
        addToRecentProjects(projectPath);
        setWorkingDir(projectPath);
        
        // Persist the working directory
        try {
          await (window as any).electron.salesforce.setWorkingDirectory(projectPath);
        } catch (error) {
          console.error('Failed to set working directory:', error);
        }
        
        // Reload to apply changes
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        alert(`Project not found or invalid:\n${projectPath}\n\nIt may have been moved or deleted.`);
        
        // Remove from recent projects
        setRecentProjects((prev) => prev.filter((p) => p.path !== projectPath));
      }
    } catch (error) {
      console.error('Failed to switch project:', error);
      alert('Failed to switch project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatLastOpened = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  if (!workingDir) return null;

  return (
    <>
      <div className="working-directory">
        <div className="working-directory-content">
          <Folder size={16} />
          <button
            className="working-directory-path-button"
            onClick={handleProjectClick}
            title={`${workingDir}\n\nClick to switch or create a new project`}
          >
            {workingDir}
          </button>
          
          {recentProjects.length > 0 && (
            <button
              className="working-directory-button"
              onClick={() => setShowRecentProjects(!showRecentProjects)}
              disabled={loading}
              title="Recent projects"
            >
              <Clock size={14} />
              <ChevronDown size={12} />
            </button>
          )}
          
          <button
            className="working-directory-button"
            onClick={handleSelectFolder}
            disabled={loading}
            title="Quick browse for project folder"
          >
            {loading ? <RefreshCw size={14} className="spinning" /> : <RefreshCw size={14} />}
          </button>
        </div>
        
        {showRecentProjects && recentProjects.length > 0 && (
          <div className="recent-projects-dropdown">
            <div className="recent-projects-header">Recent Projects</div>
            <div className="recent-projects-list">
              {recentProjects.map((project) => (
                <button
                  key={project.path}
                  className={`recent-project-item ${project.path === workingDir ? 'active' : ''}`}
                  onClick={() => handleSelectRecentProject(project.path)}
                  disabled={loading}
                >
                  <div className="recent-project-info">
                    <Folder size={14} />
                    <div className="recent-project-details">
                      <div className="recent-project-name">{project.name}</div>
                      <div className="recent-project-path">{project.path}</div>
                    </div>
                  </div>
                  <div className="recent-project-time">{formatLastOpened(project.lastOpened)}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {showProjectModal && (
        <ProjectSetupModal onClose={handleCloseProjectModal} />
      )}
    </>
  );
}
