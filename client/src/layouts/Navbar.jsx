import React from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const routeTitleMap = {
  '/teams': 'Teams Management',
  '/players': 'Players in Teams',
  '/matches': 'Match Schedule',
  '/player-statistics': 'Player Statistics',
  '/team-statistics': 'Team Statistics',
};

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const pageTitle = routeTitleMap[currentPath] || 'IPL Management';

  const handleRefresh = () => {
    toast.success('Refreshing data...', { id: 'refresh-data' });
    window.dispatchEvent(new CustomEvent('ipl-data-refresh'));
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-title">{pageTitle}</h1>
        <div className="navbar-breadcrumb">
          <span>IPL System</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-secondary)' }}>
            {currentPath.substring(1).split('-').map((part) => (
              part.charAt(0).toUpperCase() + part.slice(1)
            )).join(' ')}
          </span>
        </div>
      </div>

      <div className="navbar-right">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleRefresh}
          title="Refresh current page data"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>

        <div className="db-status-pill" title="Connected to MySQL Database">
          <div className="status-dot" />
          <span>Connected</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
