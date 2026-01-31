import React, { useState } from 'react';
import { FolderOpen, FolderPlus, X } from 'lucide-react';

interface ProjectSetupModalProps {
  onClose: () => void;
}

const ProjectSetupModal: React.FC<ProjectSetupModalProps> = ({ onClose }) => {
  const [projectName, setProjectName] = useState('');
  const [template, setTemplate] = useState<'standard' | 'empty' | 'analytics'>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Select directory where project should be created
      const parentDir = await window.electron.salesforce.selectFolder();
      if (!parentDir) {
        setLoading(false);
        return; // User cancelled
      }

      // Create project in selected directory
      await window.electron.sfCli.createProject(projectName, template, parentDir);
      
      // The CLI creates a folder with the project name, so we need to navigate into it
      // Build the path: parentDir/projectName
      const newProjectPath = `${parentDir}/${projectName}`.replace(/\\/g, '/');
      
      // Change working directory by calling selectFolder is not ideal,
      // we need to manually change directory. For now, notify user and reload.
      alert(`Project '${projectName}' created successfully in ${newProjectPath}!\n\nPlease use the folder icon in the header to navigate to the new project folder.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = async () => {
    setLoading(true);
    setError(null);

    try {
      const selectedPath = await window.electron.salesforce.selectFolder();
      if (!selectedPath) {
        setLoading(false);
        return; // User cancelled
      }

      // Check if it's a valid Salesforce project
      const isProject = await window.electron.sfCli.checkIfSalesforceProject(selectedPath);
      
      if (isProject) {
        // Directory was already changed by selectFolder, now close and refresh
        onClose();
        // Delay to ensure state is updated
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        setError('Selected folder is not a Salesforce project (missing sfdx-project.json)');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open project');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Salesforce Project Setup</h2>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="modal-error">
            {error}
          </div>
        )}

        <div className="modal-body">
          <p className="modal-description">
            No Salesforce project detected in the current directory. 
            You can create a new project or open an existing one.
          </p>

          <div className="modal-section">
            <h3><FolderPlus size={18} /> Create New Project</h3>
            <div className="form-group">
              <label htmlFor="projectName">Project Name</label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-salesforce-project"
                disabled={loading}
                className="modal-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="template">Template</label>
              <select
                id="template"
                value={template}
                onChange={(e) => setTemplate(e.target.value as 'standard' | 'empty' | 'analytics')}
                disabled={loading}
                className="modal-select"
              >
                <option value="standard">Standard (with sample code)</option>
                <option value="empty">Empty (minimal structure)</option>
                <option value="analytics">Analytics (with Analytics templates)</option>
              </select>
            </div>

            <button
              className="modal-button primary"
              onClick={handleCreateProject}
              disabled={loading || !projectName.trim()}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>

          <div className="modal-divider">
            <span>OR</span>
          </div>

          <div className="modal-section">
            <h3><FolderOpen size={18} /> Open Existing Project</h3>
            <p className="modal-hint">
              Select a folder that contains an existing Salesforce project (with sfdx-project.json)
            </p>
            <button
              className="modal-button secondary"
              onClick={handleOpenProject}
              disabled={loading}
            >
              {loading ? 'Opening...' : 'Browse for Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetupModal;
