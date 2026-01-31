import React, { useState, useEffect } from 'react';
import { Cloud, RefreshCw, LogIn, LogOut, ExternalLink, ChevronDown } from 'lucide-react';

interface OrgInfo {
  username: string;
  orgId: string;
  instanceUrl: string;
  alias?: string;
}

interface SalesforceOrg {
  alias?: string;
  username: string;
  orgId: string;
  instanceUrl: string;
  isDefaultUsername: boolean;
  isDefaultDevHubUsername: boolean;
}

const SalesforceOrgManager: React.FC = () => {
  const [currentOrg, setCurrentOrg] = useState<OrgInfo | null>(null);
  const [allOrgs, setAllOrgs] = useState<SalesforceOrg[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cliInstalled, setCliInstalled] = useState(false);

  useEffect(() => {
    checkCliAndLoadOrg();
  }, []);

  const checkCliAndLoadOrg = async () => {
    try {
      const installed = await window.electron.sfCli.checkInstalled();
      setCliInstalled(installed);
      
      if (installed) {
        await loadCurrentOrg();
      }
    } catch (error) {
      console.error('Failed to check SF CLI:', error);
    }
  };

  const loadCurrentOrg = async () => {
    setLoading(true);
    try {
      const org = await window.electron.sfCli.getCurrentOrg();
      setCurrentOrg(org);
    } catch (error) {
      console.error('Failed to load current org:', error);
      setCurrentOrg(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAllOrgs = async () => {
    try {
      const orgs = await window.electron.sfCli.listOrgs();
      setAllOrgs(orgs);
    } catch (error) {
      console.error('Failed to load orgs:', error);
      setAllOrgs([]);
    }
  };

  const handleLoginClick = async () => {
    try {
      setLoading(true);
      const alias = prompt('Enter org alias (optional):');
      await window.electron.sfCli.loginToOrg(alias || undefined);
      await loadCurrentOrg();
      alert('Successfully logged in to org!');
    } catch (error) {
      alert(`Failed to login: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchOrg = async (usernameOrAlias: string) => {
    try {
      setLoading(true);
      await window.electron.sfCli.setDefaultOrg(usernameOrAlias);
      await loadCurrentOrg();
      setShowDropdown(false);
    } catch (error) {
      alert(`Failed to switch org: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOrg = async () => {
    try {
      await window.electron.sfCli.openOrg();
    } catch (error) {
      alert(`Failed to open org: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDropdownToggle = async () => {
    if (!showDropdown) {
      await loadAllOrgs();
    }
    setShowDropdown(!showDropdown);
  };

  if (!cliInstalled) {
    return (
      <div className="sf-org-manager" title="Salesforce CLI not installed">
        <Cloud size={16} className="text-error" />
        <span className="sf-org-text">SF CLI Not Found</span>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="sf-org-manager">
        <button
          className="sf-org-button"
          onClick={handleLoginClick}
          disabled={loading}
          title="Login to Salesforce Org"
        >
          <LogIn size={16} />
          <span>Connect Org</span>
        </button>
      </div>
    );
  }

  return (
    <div className="sf-org-manager">
      <div className="sf-org-current">
        <Cloud size={16} />
        <div className="sf-org-info">
          <span className="sf-org-alias" title={currentOrg.username}>
            {currentOrg.alias || currentOrg.username}
          </span>
        </div>
        
        <button
          className="sf-org-icon-button"
          onClick={handleOpenOrg}
          title="Open org in browser"
          disabled={loading}
        >
          <ExternalLink size={14} />
        </button>
        
        <button
          className="sf-org-icon-button"
          onClick={loadCurrentOrg}
          disabled={loading}
          title="Refresh org info"
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
        </button>
        
        <button
          className="sf-org-icon-button"
          onClick={handleDropdownToggle}
          title="Switch org"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {showDropdown && (
        <div className="sf-org-dropdown">
          <div className="sf-org-dropdown-header">
            <span>Connected Orgs</span>
            <button
              className="sf-org-dropdown-login"
              onClick={handleLoginClick}
            >
              <LogIn size={12} />
              Add Org
            </button>
          </div>
          
          {allOrgs.length === 0 ? (
            <div className="sf-org-dropdown-empty">No orgs found</div>
          ) : (
            <div className="sf-org-dropdown-list">
              {allOrgs.map((org) => (
                <div
                  key={org.username}
                  className={`sf-org-dropdown-item ${
                    org.username === currentOrg.username ? 'active' : ''
                  }`}
                  onClick={() => handleSwitchOrg(org.alias || org.username)}
                >
                  <div className="sf-org-dropdown-item-info">
                    <span className="sf-org-dropdown-item-name">
                      {org.alias || org.username}
                    </span>
                    {org.alias && (
                      <span className="sf-org-dropdown-item-username">
                        {org.username}
                      </span>
                    )}
                  </div>
                  {org.isDefaultUsername && (
                    <span className="sf-org-dropdown-badge">Default</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesforceOrgManager;
