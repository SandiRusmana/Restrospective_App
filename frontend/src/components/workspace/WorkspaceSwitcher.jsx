import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  X, 
  Plus 
} from 'lucide-react';
import Avatar from '../common/Avatar';

export default function WorkspaceSwitcher({ 
  workspaces = [], 
  activeWorkspace, 
  onSelectWorkspace, 
  searchQuery = '', 
  onSearchChange,
  onCreateWorkspace,
  onShowToast
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter workspaces based on searchQuery
  const filteredWorkspaces = searchQuery?.trim()
    ? workspaces.filter((ws) => ws.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : workspaces;

  const currentWsInitial = activeWorkspace?.initial || (activeWorkspace?.name ? activeWorkspace.name.charAt(0).toUpperCase() : 'W');
  const currentWsName = activeWorkspace?.name || 'Pilih Workspace';
  const currentWsColor = activeWorkspace?.color || '#5956e9';

  return (
    <div className="switcher-panel">
      <div className="switcher-section-title">
        Berpindah Workspace
      </div>

      <div className="switcher-controls-row">
        {/* Workspace Dropdown Selector */}
        <div className="switcher-dropdown-container" ref={dropdownRef}>
          <button 
            type="button"
            className="switcher-dropdown-trigger"
            onClick={() => setIsOpen(!isOpen)}
            title="Pilih Workspace"
          >
            <div className="dropdown-current-item">
              <Avatar 
                initial={currentWsInitial} 
                color={currentWsColor} 
                size="sm" 
              />
              <span>{currentWsName}</span>
            </div>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isOpen && (
            <div className="switcher-dropdown-menu">
              {filteredWorkspaces.length === 0 ? (
                <div style={{ padding: '10px 14px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
                  Tidak ada workspace ditemukan
                </div>
              ) : (
                filteredWorkspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    className={`dropdown-item ${ws.id === activeWorkspace?.id ? 'active' : ''}`}
                    onClick={() => {
                      if (onSelectWorkspace) onSelectWorkspace(ws.id);
                      setIsOpen(false);
                    }}
                  >
                    <Avatar 
                      initial={ws.initial || ws.name?.charAt(0).toUpperCase() || 'W'} 
                      color={ws.color || '#5956e9'} 
                      size="sm" 
                    />
                    <span>{ws.name}</span>
                  </button>
                ))
              )}

              {onCreateWorkspace && (
                <button
                  type="button"
                  className="dropdown-create-btn"
                  onClick={() => {
                    setIsOpen(false);
                    onCreateWorkspace();
                  }}
                >
                  <Plus size={16} />
                  <span>Buat Workspace Baru</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="switcher-search-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={17} className="switcher-search-icon" />
          <input 
            type="text"
            className="switcher-search-input"
            placeholder="Cari workspace..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange && onSearchChange('')}
              title="Hapus pencarian"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <X size={15} />
            </button>
          ) : (
            <button 
              type="button"
              className="switcher-filter-btn" 
              title="Filter workspace"
              onClick={() => onShowToast && onShowToast('Filter pencarian workspace aktif')}
            >
              <SlidersHorizontal size={17} />
            </button>
          )}
        </div>
      </div>

      {/* Tips Banner */}
      {showTips && (
        <div className="tips-banner">
          <div className="tips-content">
            <div className="tips-icon-wrapper">
              <Sparkles size={18} />
            </div>
            <p className="tips-text">
              <strong>Tips</strong>
              Gunakan switcher di sebelah kiri untuk berpindah workspace dengan mudah.
            </p>
          </div>
          <button 
            type="button"
            className="tips-close-btn"
            onClick={() => setShowTips(false)}
            title="Tutup tips"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
