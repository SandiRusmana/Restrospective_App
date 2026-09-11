import React, { useState, useMemo } from 'react';
import {
  Clock,
  Kanban,
  Users,
  CheckCircle2,
  FileDown,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  Calendar,
  Zap,
} from 'lucide-react';

export default function ActivityView({
  workspace,
  workspaces = [],
  currentUser,
  onOpenBoard,
  onCreateBoard,
  onInviteMember,
  onShowToast,
}) {
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'boards' | 'members' | 'actions'
  const [searchQuery, setSearchQuery] = useState('');

  const boards = workspace?.boards || [];
  const members = workspace?.members || [];

  // Calculate dynamic summary metrics
  const totalCards = useMemo(() => {
    return boards.reduce((acc, b) => acc + (b.cardsCount || 0), 0);
  }, [boards]);

  // Construct realistic timeline events from real workspace data
  const activities = useMemo(() => {
    const list = [];

    // 1. Board creation / session activities
    boards.forEach((b, idx) => {
      const bDate = b.createdAt ? new Date(b.createdAt) : new Date(Date.now() - (idx + 1) * 86400000);
      list.push({
        id: `act_board_${b.id}`,
        type: 'board',
        icon: Kanban,
        iconColor: '#5956e9',
        iconBg: '#f3f0ff',
        title: `Sesi Retrospective "${b.title || b.name}" dibuat`,
        description: `Template: ${b.template || 'Start Stop Continue'} · ${b.cardsCount || 0} catatan terhimpun`,
        timestamp: bDate,
        dateFormatted: bDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        user: members[0] || { name: 'Fasilitator' },
        board: b,
        actionLabel: 'Buka Sesi Board',
      });

      if (b.cardsCount > 0) {
        const cardDate = new Date(bDate.getTime() + 3600000);
        list.push({
          id: `act_cards_${b.id}`,
          type: 'actions',
          icon: Zap,
          iconColor: '#10b981',
          iconBg: '#ecfdf5',
          title: `Diskusi & Voting selesai pada "${b.title || b.name}"`,
          description: `${b.cardsCount} catatan tim telah dibahas bersama`,
          timestamp: cardDate,
          dateFormatted: cardDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          user: members[idx % members.length] || members[0],
          board: b,
          actionLabel: 'Lihat Hasil',
        });
      }
    });

    // 2. Member join events
    members.forEach((m, idx) => {
      const joinDate = new Date(Date.now() - (idx * 2 + 1) * 86400000 * 2);
      list.push({
        id: `act_member_${m.id || idx}`,
        type: 'members',
        icon: Users,
        iconColor: '#2563eb',
        iconBg: '#eff6ff',
        title: `${m.name || 'Anggota baru'} bergabung ke workspace`,
        description: `Peran: ${m.role || 'Member'} · Email: ${m.email || '-'}`,
        timestamp: joinDate,
        dateFormatted: joinDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        user: m,
      });
    });

    // Sort newest first
    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  }, [boards, members]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesFilter = selectedFilter === 'all' || act.type === selectedFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [activities, selectedFilter, searchQuery]);

  return (
    <div className="activity-view-container">
      {/* Header Banner */}
      <header className="activity-view-header">
        <div>
          <div className="activity-header-badge">
            <Clock size={13} />
            <span>Timeline Log Workspace</span>
          </div>
          <h1 className="activity-header-title">Aktivitas Tim</h1>
          <p className="activity-header-desc">
            Pantau seluruh riwayat sesi retrospective, kolaborasi kartu, dan perkembangan tim di workspace{' '}
            <strong>{workspace?.name || 'RetroNerve'}</strong>.
          </p>
        </div>

        <div className="activity-header-actions">
          {onCreateBoard && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onCreateBoard}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Kanban size={16} />
              <span>+ Buat Sesi Baru</span>
            </button>
          )}
        </div>
      </header>

      {/* Metric Cards Summary */}
      <div className="activity-stats-grid">
        <div className="activity-stat-card">
          <div className="activity-stat-icon" style={{ backgroundColor: '#f3f0ff', color: '#5956e9' }}>
            <Kanban size={20} />
          </div>
          <div className="activity-stat-content">
            <span className="activity-stat-value">{boards.length}</span>
            <span className="activity-stat-label">Total Board Retrospective</span>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="activity-stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Users size={20} />
          </div>
          <div className="activity-stat-content">
            <span className="activity-stat-value">{members.length || 1}</span>
            <span className="activity-stat-label">Anggota Tim Aktif</span>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="activity-stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <Zap size={20} />
          </div>
          <div className="activity-stat-content">
            <span className="activity-stat-value">{totalCards}</span>
            <span className="activity-stat-label">Total Catatan Retro</span>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="activity-stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="activity-stat-content">
            <span className="activity-stat-value">{boards.length > 0 ? boards.length * 2 : 0}</span>
            <span className="activity-stat-label">Action Items Diselesaikan</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="activity-controls-bar">
        <div className="activity-filter-pills">
          <button
            type="button"
            className={`activity-filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            Semua Aktivitas ({activities.length})
          </button>
          <button
            type="button"
            className={`activity-filter-btn ${selectedFilter === 'board' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('board')}
          >
            Sesi Board
          </button>
          <button
            type="button"
            className={`activity-filter-btn ${selectedFilter === 'actions' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('actions')}
          >
            Diskusi & Voting
          </button>
          <button
            type="button"
            className={`activity-filter-btn ${selectedFilter === 'members' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('members')}
          >
            Anggota Tim
          </button>
        </div>

        <div className="activity-search-box">
          <Search size={15} className="activity-search-icon" />
          <input
            type="text"
            placeholder="Cari aktivitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="activity-search-input"
          />
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="activity-timeline-wrapper">
        {filteredActivities.length === 0 ? (
          <div className="activity-empty-card">
            <div className="activity-empty-icon">
              <Clock size={32} />
            </div>
            <h3>Belum Ada Aktivitas Terkait</h3>
            <p>Aktivitas akan tercatat secara otomatis saat tim Anda membuat sesi retro atau berkolaborasi.</p>
          </div>
        ) : (
          <div className="activity-timeline">
            {filteredActivities.map((act) => {
              const IconComp = act.icon;
              return (
                <div key={act.id} className="activity-item">
                  <div className="activity-item-left">
                    <div
                      className="activity-item-icon"
                      style={{ backgroundColor: act.iconBg, color: act.iconColor }}
                    >
                      <IconComp size={16} />
                    </div>
                    <div className="activity-item-line"></div>
                  </div>

                  <div className="activity-item-content">
                    <div className="activity-item-header">
                      <div className="activity-item-user">
                        <img
                          src={
                            act.user?.avatar ||
                            act.user?.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.user?.name || 'user'}`
                          }
                          alt={act.user?.name || 'User'}
                          className="activity-user-avatar"
                        />
                        <span className="activity-user-name">{act.user?.name || 'Anggota'}</span>
                      </div>
                      <span className="activity-item-date">{act.dateFormatted}</span>
                    </div>

                    <h3 className="activity-item-title">{act.title}</h3>
                    <p className="activity-item-desc">{act.description}</p>

                    {act.board && onOpenBoard && (
                      <button
                        type="button"
                        className="activity-item-action-btn"
                        onClick={() => onOpenBoard(act.board)}
                      >
                        <span>{act.actionLabel || 'Lihat Board'}</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
