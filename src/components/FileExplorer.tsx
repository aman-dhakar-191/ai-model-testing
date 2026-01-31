import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import type { FileTreeItem } from '../electron';

interface FileTreeNodeProps {
  item: FileTreeItem;
  depth: number;
  onFileClick?: (filePath: string) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ item, depth, onFileClick }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels

  const handleToggle = () => {
    if (item.type === 'directory' && item.children) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = () => {
    if (item.type === 'file' && onFileClick) {
      onFileClick(item.path);
    } else {
      handleToggle();
    }
  };

  const getFileIcon = () => {
    if (item.type === 'directory') {
      return isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />;
    }

    // File type icons based on extension
    const ext = item.extension?.toLowerCase();
    const iconClass = ext ? `file-icon-${ext.substring(1)}` : 'file-icon-default';
    
    return <File size={16} className={iconClass} />;
  };

  const getFileTypeClass = () => {
    if (item.type === 'directory') return 'directory';
    
    const ext = item.extension?.toLowerCase();
    switch (ext) {
      case '.cls':
      case '.trigger':
        return 'apex-file';
      case '.js':
        return 'js-file';
      case '.html':
        return 'html-file';
      case '.css':
        return 'css-file';
      case '.xml':
        return 'xml-file';
      case '.json':
        return 'json-file';
      default:
        return 'default-file';
    }
  };

  return (
    <div className="file-tree-node">
      <div
        className={`file-tree-item ${getFileTypeClass()}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {item.type === 'directory' && item.children && (
          <span className="file-tree-chevron" onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {item.type === 'directory' && !item.children && (
          <span className="file-tree-chevron empty" />
        )}
        <span className="file-tree-icon">{getFileIcon()}</span>
        <span className="file-tree-name" title={item.path}>{item.name}</span>
      </div>
      
      {item.type === 'directory' && item.children && isExpanded && (
        <div className="file-tree-children">
          {item.children.map((child, index) => (
            <FileTreeNode
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer: React.FC = () => {
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [workingDir, setWorkingDir] = useState<string>('');

  useEffect(() => {
    loadFileTree();
  }, []);

  const loadFileTree = async () => {
    setLoading(true);
    try {
      const dir = await window.electron.salesforce.getWorkingDirectory();
      setWorkingDir(dir);
      
      const treeJson = await window.electron.salesforce.getFileTree();
      const tree: FileTreeItem[] = JSON.parse(treeJson);
      setFileTree(tree);
    } catch (error) {
      console.error('Failed to load file tree:', error);
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (filePath: string) => {
    console.log('File clicked:', filePath);
    // Future: Implement file opening/viewing
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <div className="file-explorer-title">
          <Folder size={16} />
          <span>Explorer</span>
        </div>
        <button
          className="file-explorer-refresh"
          onClick={loadFileTree}
          disabled={loading}
          title="Refresh file tree"
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      <div className="file-explorer-path" title={workingDir}>
        {workingDir.split(/[/\\]/).pop() || workingDir}
      </div>

      <div className="file-explorer-tree">
        {loading && fileTree.length === 0 ? (
          <div className="file-explorer-loading">Loading files...</div>
        ) : fileTree.length > 0 ? (
          fileTree.map((item, index) => (
            <FileTreeNode
              key={`${item.path}-${index}`}
              item={item}
              depth={0}
              onFileClick={handleFileClick}
            />
          ))
        ) : (
          <div className="file-explorer-empty">No files found</div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
