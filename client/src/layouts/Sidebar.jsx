import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Trophy,
  LayoutDashboard,
  Shield,
  Users,
  Swords,
  Calendar,
  MapPin,
  UserCheck,
  DollarSign,
  Award,
  Activity,
  Briefcase,
  BarChart3,
} from 'lucide-react';

const Sidebar = () => {
  const navSections = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Management',
      items: [
        { name: 'Teams', path: '/teams', icon: Shield },
        { name: 'Players', path: '/players', icon: Users },
        { name: 'Matches', path: '/matches', icon: Swords },
        { name: 'Seasons', path: '/seasons', icon: Calendar },
        { name: 'Venues', path: '/venues', icon: MapPin },
      ],
    },
    {
      title: 'More',
      items: [
        { name: 'Umpires', path: '/umpires', icon: UserCheck },
        { name: 'Sponsors', path: '/sponsors', icon: DollarSign },
        { name: 'Awards', path: '/awards', icon: Award },
        { name: 'Innings', path: '/innings', icon: Activity },
        { name: 'Owners', path: '/owners', icon: Briefcase },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { name: 'Reports', path: '/reports', icon: BarChart3 },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Trophy size={22} />
        </div>
        <div className="sidebar-brand-text">
          <h2>IPL MANAGER</h2>
          <span>Tournament Hub</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="nav-section">
            <div className="nav-section-title">{section.title}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>IPL DB v1.0.0</span>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>2024 Season Edition</p>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
      </div>
    </aside>
  );
};

export default Sidebar;
