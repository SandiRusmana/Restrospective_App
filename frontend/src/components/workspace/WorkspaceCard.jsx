import React from 'react';
import { MoreVertical, User, Calendar } from 'lucide-react';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';

export default function WorkspaceCard({ 
  workspace, 
  isSelected, 
  onSelect, 
  viewMode = 'grid' 
}) {
  const isListView = viewMode === 'list';

  return (
    <div 
      className={`workspace-card ${isSelected ? 'selected' : ''} ${isListView ? 'list-view' : ''}`}
      onClick={() => onSelect(workspace.id)}
    >
      <div className="card-header-top">
        <div className="card-identity">
          <Avatar 
            initial={workspace.initial} 
            color={workspace.color} 
            size={isListView ? 'sm' : 'md'} 
          />
          <div>
            <div className="card-title-group">
              <h3 className="card-title">{workspace.name}</h3>
              <Badge variant={workspace.role}>{workspace.role}</Badge>
            </div>
            {isListView && (
              <p className="card-description" style={{ marginTop: '4px', marginBottom: 0 }}>
                {workspace.description}
              </p>
            )}
          </div>
        </div>
        <button 
          className="btn-ghost-icon"
          onClick={(e) => {
            e.stopPropagation();
            alert(`Menu opsi untuk workspace ${workspace.name}`);
          }}
          title="Opsi lainnya"
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {!isListView && (
        <p className="card-description">
          {workspace.description}
        </p>
      )}

      <div className="card-footer-info">
        <div className="info-item">
          <User size={15} />
          <span>{workspace.memberCount} anggota</span>
        </div>
        <div className="info-item">
          <Calendar size={15} />
          <span>{workspace.dateText}</span>
        </div>
      </div>
    </div>
  );
}
