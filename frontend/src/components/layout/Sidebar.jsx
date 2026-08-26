import React from 'react';
import { 
  Zap, 
  LayoutGrid, 
  Kanban, 
  Clock, 
  FileText, 
  Settings, 
  ChevronDown 
} from 'lucide-react';

const iconMap = {
  LayoutGrid: LayoutGrid,
  Kanban: Kanban,
  Clock: Clock,
  FileText: FileText,
  Settings: Settings
};

export default function Sidebar({ 
  navItems, 
  activeNav, 
  onSelectNav, 
  recentWorkspaces, 
  activeWorkspaceId, 
  onSelectWorkspace,
  currentUser 
}) {
  return (
    <aside className="sidebar">
      {/* Brand / Logo */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <Zap size={22} fill="#ffffff" />
        </div>
        <span className="brand-title">RetroNerve</span>
      </div>

      {/* Main Navigation Items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = iconMap[item.icon] || LayoutGrid;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectNav(item.id)}
            >
              <IconComponent size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Section: Terakhir Dibuka */}
      <div className="sidebar-section-title">
        Terakhir Dibuka
      </div>

      {/* Recent Workspaces List */}
      <div className="sidebar-recent-list">
        {recentWorkspaces.map((ws) => (
          <button
            key={ws.id}
            className={`recent-item ${activeWorkspaceId === ws.id ? 'active' : ''}`}
            onClick={() => onSelectWorkspace(ws.id)}
          >
            <div 
              className="recent-badge"
              style={{ backgroundColor: ws.color }}
            >
              {ws.initial}
            </div>
            <span className="recent-name">{ws.name}</span>
          </button>
        ))}
      </div>

      {/* Bottom User Profile */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-info-wrapper">
            <div className="user-avatar-container">
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="user-avatar-img" 
              />
              <span className="user-status-dot" />
            </div>
            <div className="user-details">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-email">{currentUser.email}</span>
            </div>
          </div>
          <div className="user-dropdown-arrow">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>
    </aside>
  );
}
