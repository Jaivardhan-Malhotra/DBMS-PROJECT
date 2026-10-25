import React from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const routeTitleMap = {
  '/': 'Dashboard Overview',
  '/teams': 'Teams Management',
  '/players': 'Players Roster & Stats',
  '/matches': 'Match Fixtures & Results',
  '/seasons': 'Seasons Archive',
  '/venues': 'Stadiums & Venues',
  '/umpires': 'Match Officials & Umpires',
  '/sponsors': 'Sponsors & Brand Partnerships',
  '/awards': 'Awards & Honors',
  '/innings': 'Innings Scorecards',
  '/owners': 'Franchise Owners',
  '/reports': 'Analytics & Performance Reports',
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
            {currentPath === '/' ? 'Dashboard' : currentPath.substring(1).charAt(0).toUpperCase() + currentPath.slice(2)}
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
