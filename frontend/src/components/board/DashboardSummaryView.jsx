import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BarChart2,
  Check,
  Clock,
  Save,
  Search,
  Calendar,
  ChevronDown,
  MoreHorizontal,
  MoreVertical,
  ListTodo,
  Loader2,
  Trophy,
  ThumbsUp,
  Layout,
  Globe,
  Sparkles,
  PlayCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import '../../styles/dashboard-summary.css';

/**
 * Status Pill Dropdown untuk Action Item di Tabel Dashboard
 */
function DashboardStatusPill({ status, itemId, onChangeStatus }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpwards(spaceBelow < 140);
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const rawStatus = (status || 'PENDING').toUpperCase();
  const displayLabel =
    rawStatus === 'DONE'
      ? 'Selesai'
      : rawStatus === 'IN_PROGRESS'
      ? 'In Progress'
      : 'Pending';

  const statusClass = rawStatus === 'DONE' ? 'selesai' : rawStatus === 'IN_PROGRESS' ? 'in_progress' : 'pending';

  return (
    <div className="dash-status-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`dash-status-btn ${statusClass}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Ubah status"
      >
        <span>{displayLabel}</span>
        <span className="dash-status-chevron">▼</span>
      </button>

      {isOpen && (
        <div className={`dash-status-menu ${openUpwards ? 'open-upwards' : ''}`}>
          <button
            type="button"
            className={`dash-status-option selesai ${rawStatus === 'DONE' ? 'active' : ''}`}
            onClick={() => {
              onChangeStatus(itemId, 'DONE');
              setIsOpen(false);
            }}
          >
            <span>Selesai</span>
            {rawStatus === 'DONE' && <Check size={13} />}
          </button>
          <button
            type="button"
            className={`dash-status-option in_progress ${rawStatus === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => {
              onChangeStatus(itemId, 'IN_PROGRESS');
              setIsOpen(false);
            }}
          >
            <span>In Progress</span>
            {rawStatus === 'IN_PROGRESS' && <Check size={13} />}
          </button>
          <button
            type="button"
            className={`dash-status-option pending ${rawStatus === 'PENDING' ? 'active' : ''}`}
            onClick={() => {
              onChangeStatus(itemId, 'PENDING');
              setIsOpen(false);
            }}
          >
            <span>Pending</span>
            {rawStatus === 'PENDING' && <Check size={13} />}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Komponen Utama: Dashboard Ringkasan Board (1 Board 1 Ringkasan) & Workspace
 * Mendukung status: DONE (Selesai), IN_PROGRESS (Sedang Dikerjakan), PENDING (Menunggu)
 */
export default function DashboardSummaryView({
  workspace,
  board,
  currentUser,
  onShowToast,
  onSwitchBoard,
}) {
  const boardId = board?.id;
  const workspaceId = workspace?.id || board?.workspaceId;

  // Scope: 'board' (1 Board 1 Ringkasan - Default) | 'workspace'
  const [scope, setScope] = useState('board');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Date Filter State
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setIsDateDropdownOpen(false);
      }
    };
    if (isDateDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDateDropdownOpen]);

  // Action Items List & Top Cards State
  const [actionItems, setActionItems] = useState([]);
  const [topCards, setTopCards] = useState([]);

  // Summary Metrics State (Selesai, In Progress, Pending)
  const [summaryData, setSummaryData] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    completionRate: 0,
    inProgressRate: 0,
    pendingRate: 0,
    totalCards: 0,
    totalVotes: 0,
  });

  // Calculate Date Bounds based on Filter
  const dateParams = useMemo(() => {
    if (selectedFilter === 'all') return {};
    const now = new Date();
    const endStr = now.toISOString().split('T')[0];
    let start = new Date();

    if (selectedFilter === '7days') {
      start.setDate(now.getDate() - 7);
    } else if (selectedFilter === '30days') {
      start.setDate(now.getDate() - 30);
    } else if (selectedFilter === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: endStr,
    };
  }, [selectedFilter]);

  // Load Dashboard Data (Board-Specific or Workspace-Wide)
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (scope === 'board' && boardId) {
        // ── 1. Load khusus 1 Board ──
        const res = await api.getBoardDashboardSummary(boardId, dateParams);
        if (res) {
          const total = res.total ?? 0;
          const completed = res.completed ?? res.done ?? 0;
          const inProgress = res.inProgress ?? 0;
          const pending = res.pending ?? 0;
          const compRate = total > 0 ? Math.round((completed / total) * 100) : 0;
          const inProgRate = total > 0 ? Math.round((inProgress / total) * 100) : 0;
          const pendRate = total > 0 ? Math.max(0, 100 - compRate - inProgRate) : 0;

          setSummaryData({
            total,
            completed,
            inProgress,
            pending,
            completionRate: compRate,
            inProgressRate: inProgRate,
            pendingRate: pendRate,
            totalCards: res.totalCards ?? 0,
            totalVotes: res.totalVotes ?? 0,
          });

          setTopCards(Array.isArray(res.topCards) ? res.topCards : []);

          if (Array.isArray(res.actionItems)) {
            setActionItems(
              res.actionItems.map((item) => ({
                id: item.id,
                title: item.title || 'Action item',
                status: (item.status || 'PENDING').toUpperCase(),
                boardId: item.boardId || boardId,
                boardName: res.boardTitle || board?.title || 'Board Ini',
                assignee: item.assignee || {
                  name: 'Belum ditugaskan',
                  avatarUrl: null,
                },
                createdAt: item.createdAt,
              }))
            );
          }
        }
      } else if (workspaceId) {
        // ── 2. Load agregat seluruh Workspace ──
        const [summaryRes, itemsRes] = await Promise.all([
          api.getDashboardSummary(workspaceId, dateParams),
          api.getWorkspaceActionItems(workspaceId),
        ]);

        let total = 0;
        let completed = 0;
        let pending = 0;
        let inProg = 0;

        if (summaryRes && typeof summaryRes.total === 'number') {
          total = summaryRes.total;
          completed = summaryRes.completed ?? summaryRes.done ?? 0;
          pending = summaryRes.pending ?? 0;
          inProg = summaryRes.inProgress ?? 0;
        }

        const compRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const inProgRate = total > 0 ? Math.round((inProg / total) * 100) : 0;
        const pendRate = total > 0 ? Math.max(0, 100 - compRate - inProgRate) : 0;

        setSummaryData({
          total,
          completed,
          inProgress: inProg,
          pending,
          completionRate: compRate,
          inProgressRate: inProgRate,
          pendingRate: pendRate,
          totalCards: 0,
          totalVotes: 0,
        });

        setTopCards([]);

        if (Array.isArray(itemsRes)) {
          setActionItems(
            itemsRes.map((item) => ({
              id: item.id,
              title: item.title || item.content || 'Action item',
              status: (item.status || 'PENDING').toUpperCase(),
              boardId: item.boardId,
              boardName: item.board?.name || item.board?.title || 'Board Retrospective',
              assignee: item.assignee || {
                name: 'Belum ditugaskan',
                avatarUrl: null,
              },
              createdAt: item.createdAt,
            }))
          );
        }
      }
    } catch (err) {
      console.error('[DashboardSummary] Gagal memuat data:', err);
      if (Array.isArray(board?.actionItems) && board.actionItems.length > 0) {
        const bItems = board.actionItems;
        const done = bItems.filter((i) => i.status === 'DONE').length;
        const inProg = bItems.filter((i) => i.status === 'IN_PROGRESS').length;
        const pend = bItems.filter((i) => i.status === 'PENDING').length;
        const tot = bItems.length;
        const comp = tot > 0 ? Math.round((done / tot) * 100) : 0;
        const inProgR = tot > 0 ? Math.round((inProg / tot) * 100) : 0;
        setSummaryData({
          total: tot,
          completed: done,
          inProgress: inProg,
          pending: pend,
          completionRate: comp,
          inProgressRate: inProgR,
          pendingRate: Math.max(0, 100 - comp - inProgR),
          totalCards: 0,
          totalVotes: 0,
        });
        setActionItems(bItems);
      }
    } finally {
      setIsLoading(false);
    }
  }, [scope, boardId, workspaceId, dateParams, board?.title, board?.actionItems]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handler: Ubah Status Action Item secara Realtime
  const handleUpdateStatus = async (itemId, newStatus) => {
    // 1. Optimistic local update pada tabel
    setActionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
    );

    // 2. Hitung ulang statistik summary secara instan
    setActionItems((currentItems) => {
      const total = currentItems.length;
      const doneCount = currentItems.filter((i) => i.status === 'DONE').length;
      const inProgCount = currentItems.filter((i) => i.status === 'IN_PROGRESS').length;
      const pendCount = currentItems.filter((i) => i.status === 'PENDING').length;

      const compRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
      const inProgRate = total > 0 ? Math.round((inProgCount / total) * 100) : 0;
      const pendRate = total > 0 ? Math.max(0, 100 - compRate - inProgRate) : 0;

      setSummaryData((prev) => ({
        ...prev,
        total,
        completed: doneCount,
        inProgress: inProgCount,
        pending: pendCount,
        completionRate: compRate,
        inProgressRate: inProgRate,
        pendingRate: pendRate,
      }));
      return currentItems;
    });

    const labelMap = {
      DONE: 'Selesai',
      IN_PROGRESS: 'In Progress',
      PENDING: 'Pending',
    };

    if (onShowToast) {
      onShowToast(`Status diubah menjadi ${labelMap[newStatus] || newStatus}`);
    }

    // 3. Kirim update ke server
    if (!String(itemId).startsWith('sample-')) {
      try {
        await api.updateActionItem(itemId, { status: newStatus });
      } catch (err) {
        console.error('Gagal update status di backend:', err);
        if (onShowToast) onShowToast('Gagal memperbarui status ke server');
      }
    }
  };

  // Filter Action Items berdasarkan search query
  const filteredActionItems = useMemo(() => {
    if (!searchQuery.trim()) return actionItems;
    const q = searchQuery.toLowerCase();
    return actionItems.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.boardName?.toLowerCase().includes(q) ||
        item.assignee?.name?.toLowerCase().includes(q)
    );
  }, [actionItems, searchQuery]);

  // Perhitungan Geometri Donut SVG 3-Segmen (Selesai, In Progress, Pending)
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~314.159

  const totalSafe = summaryData.total > 0 ? summaryData.total : 1;
  const doneRatio = summaryData.total > 0 ? summaryData.completed / totalSafe : 0;
  const inProgRatio = summaryData.total > 0 ? summaryData.inProgress / totalSafe : 0;
  const pendingRatio = summaryData.total > 0 ? summaryData.pending / totalSafe : 0;

  const doneDash = doneRatio * circumference;
  const inProgDash = inProgRatio * circumference;
  const pendingDash = pendingRatio * circumference;

  // Filter labels dictionary
  const filterLabels = {
    all: 'Semua Tanggal',
    '7days': '7 Hari Terakhir',
    '30days': '30 Hari Terakhir',
    this_month: 'Bulan Ini',
  };

  return (
    <div className="dashboard-summary-container">
      {/* ── Top Header Bar ── */}
      <div className="dash-summary-header">
        <div className="dash-summary-header-left">
          <div className="dash-summary-icon-box">
            <div className="dash-four-dots-icon">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div>
            <h2 className="dash-summary-title">
              {scope === 'board'
                ? `Ringkasan Board: ${board?.title || 'Board Ini'}`
                : `Dashboard: ${workspace?.name || 'Workspace'}`}
            </h2>
            <p className="dash-summary-subtitle">
              {scope === 'board'
                ? 'Ringkasan progress action item & insight sesi untuk board ini'
                : 'Ringkasan progress action item dalam seluruh workspace'}
            </p>
          </div>
        </div>

        <div className="dash-summary-header-right">
          {/* Scope Switcher (Board Ini vs Seluruh Workspace) */}
          <div className="dash-scope-control">
            <button
              type="button"
              className={`dash-scope-btn ${scope === 'board' ? 'active' : ''}`}
              onClick={() => setScope('board')}
              title="Tampilkan ringkasan hanya untuk board ini"
            >
              <Layout size={14} />
              <span>Board Ini</span>
            </button>
            <button
              type="button"
              className={`dash-scope-btn ${scope === 'workspace' ? 'active' : ''}`}
              onClick={() => setScope('workspace')}
              title="Tampilkan ringkasan seluruh workspace"
            >
              <Globe size={14} />
              <span>Semua Board</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="dash-summary-search-box">
            <Search size={15} className="dash-summary-search-icon" />
            <input
              type="text"
              className="dash-summary-search-input"
              placeholder={
                scope === 'board'
                  ? 'Cari action item board ini...'
                  : 'Cari board / action item...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date Range Filter Dropdown */}
          <div className="dash-summary-date-filter" ref={dateDropdownRef}>
            <button
              type="button"
              className="dash-date-filter-btn"
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              title="Filter rentang tanggal"
            >
              <Calendar size={14} color="#64748b" />
              <span>{filterLabels[selectedFilter]}</span>
              <ChevronDown size={13} color="#94a3b8" />
            </button>

            {isDateDropdownOpen && (
              <div className="dash-date-dropdown-menu">
                {Object.entries(filterLabels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`dash-date-dropdown-item ${
                      selectedFilter === key ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelectedFilter(key);
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    <span>{label}</span>
                    {selectedFilter === key && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Metric Summary Cards Grid (Total, Selesai, In Progress, Pending, Partisipasi) ── */}
      <div className={`dash-cards-grid ${scope === 'board' ? 'has-five' : 'has-four'}`}>
        {/* Card 1: Total Action Item */}
        <div className="dash-card card-total">
          <div className="dash-card-top">
            <div className="dash-card-left-header">
              <div className="dash-card-icon-badge">
                <Save size={16} />
              </div>
              <span className="dash-card-label">Total Action Item</span>
            </div>
            <button type="button" className="dash-card-menu-btn" title="Opsi">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="dash-card-value">{summaryData.total}</div>
          <p className="dash-card-sub">
            {scope === 'board' ? 'Action item board ini' : 'Semua action item'}
          </p>
        </div>

        {/* Card 2: Action Item Selesai */}
        <div className="dash-card card-selesai">
          <div className="dash-card-top">
            <div className="dash-card-left-header">
              <div className="dash-card-icon-badge">
                <Check size={18} strokeWidth={2.5} />
              </div>
              <span className="dash-card-label">Selesai</span>
            </div>
            <button type="button" className="dash-card-menu-btn" title="Opsi">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="dash-card-value">{summaryData.completed}</div>
          <p className="dash-card-sub">{summaryData.completionRate}% dari total</p>
        </div>

        {/* Card 3: Action Item In Progress */}
        <div className="dash-card card-in-progress">
          <div className="dash-card-top">
            <div className="dash-card-left-header">
              <div className="dash-card-icon-badge">
                <PlayCircle size={18} strokeWidth={2.2} />
              </div>
              <span className="dash-card-label">In Progress</span>
            </div>
            <button type="button" className="dash-card-menu-btn" title="Opsi">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="dash-card-value">{summaryData.inProgress}</div>
          <p className="dash-card-sub">{summaryData.inProgressRate}% dari total</p>
        </div>

        {/* Card 4: Action Item Pending */}
        <div className="dash-card card-pending">
          <div className="dash-card-top">
            <div className="dash-card-left-header">
              <div className="dash-card-icon-badge">
                <Clock size={18} strokeWidth={2.2} />
              </div>
              <span className="dash-card-label">Pending</span>
            </div>
            <button type="button" className="dash-card-menu-btn" title="Opsi">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="dash-card-value">{summaryData.pending}</div>
          <p className="dash-card-sub">{summaryData.pendingRate}% dari total</p>
        </div>

        {/* Card 5 (Khusus Board): Ide & Partisipasi Sesi */}
        {scope === 'board' && (
          <div className="dash-card card-ideas">
            <div className="dash-card-top">
              <div className="dash-card-left-header">
                <div className="dash-card-icon-badge">
                  <Sparkles size={16} />
                </div>
                <span className="dash-card-label">Partisipasi Sesi</span>
              </div>
              <button type="button" className="dash-card-menu-btn" title="Opsi">
                <MoreHorizontal size={16} />
              </button>
            </div>
            <div className="dash-card-value">{summaryData.totalCards} Ide</div>
            <p className="dash-card-sub">
              {summaryData.totalVotes} total suara/votes
            </p>
          </div>
        )}
      </div>

      {/* ── Top Voted Ideas Section (Khusus Board Ini) ── */}
      {scope === 'board' && topCards.length > 0 && (
        <div className="dash-top-ideas-card">
          <div className="dash-top-ideas-header">
            <div className="dash-top-ideas-title-group">
              <Trophy size={18} color="#d97706" />
              <div>
                <h3 className="dash-top-ideas-title">Ide & Catatan Terpopuler di Board Ini</h3>
                <p className="dash-top-ideas-subtitle">
                  Catatan yang mendapatkan dukungan dan suara terbanyak dari tim pada sesi ini
                </p>
              </div>
            </div>
          </div>

          <div className="dash-top-ideas-grid">
            {topCards.map((card, idx) => (
              <div key={card.id || idx} className="dash-top-idea-item">
                <div className="dash-top-idea-top">
                  <span className="dash-top-idea-col-badge">
                    {card.columnName || 'Kolom'}
                  </span>
                  <span className="dash-top-idea-votes">
                    <ThumbsUp size={12} />
                    <span>{card.votesCount} votes</span>
                  </span>
                </div>
                <p className="dash-top-idea-content">{card.content}</p>
                <div className="dash-top-idea-author">
                  <img
                    src={
                      card.authorAvatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${card.authorName || 'user'}`
                    }
                    alt={card.authorName}
                    className="dash-top-idea-avatar"
                  />
                  <span>Oleh {card.authorName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Middle Section: Action Item Progress (Donut Chart & Horizontal Bars) ── */}
      <div className="dash-progress-card">
        <div className="dash-progress-card-header">
          <BarChart2 size={18} className="dash-progress-card-header-icon" />
          <div>
            <h3 className="dash-progress-title">
              {scope === 'board'
                ? 'Progress Action Item Board Ini'
                : 'Action Item Progress Workspace'}
            </h3>
            <p className="dash-progress-subtitle">
              Perbandingan penyelesaian action item berdasarkan status
            </p>
          </div>
        </div>

        <div className="dash-progress-content-grid">
          {/* Left Column: Donut Chart with Legend (3 Status) */}
          <div className="dash-donut-wrapper">
            <div className="dash-donut-chart-container">
              <svg className="dash-donut-svg" width="140" height="140" viewBox="0 0 140 140">
                {/* Background track circle */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth={strokeWidth}
                />
                {/* Arc 1: Selesai (Green) */}
                {summaryData.completed > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#16a34a"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${doneDash} ${circumference - doneDash}`}
                    strokeDashoffset="0"
                    strokeLinecap={summaryData.inProgress === 0 && summaryData.pending === 0 ? 'butt' : 'round'}
                  />
                )}
                {/* Arc 2: In Progress (Blue) */}
                {summaryData.inProgress > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#2563eb"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${inProgDash} ${circumference - inProgDash}`}
                    strokeDashoffset={-doneDash}
                    strokeLinecap="round"
                  />
                )}
                {/* Arc 3: Pending (Red/Amber) */}
                {summaryData.pending > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${pendingDash} ${circumference - pendingDash}`}
                    strokeDashoffset={-(doneDash + inProgDash)}
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* Center Metrics (Total + Label) */}
              <div className="dash-donut-center">
                <span className="dash-donut-center-num">{summaryData.total}</span>
                <span className="dash-donut-center-label">Total</span>
              </div>
            </div>

            {/* Donut Legend (3 Status: Selesai, In Progress, Pending) */}
            <div className="dash-donut-legend">
              <div className="dash-legend-row">
                <div className="dash-legend-left">
                  <span className="dash-legend-dot selesai"></span>
                  <span>Selesai</span>
                </div>
                <div className="dash-legend-right">
                  <span className="dash-legend-count">{summaryData.completed}</span>
                  <span className="dash-legend-pct selesai">{summaryData.completionRate}%</span>
                </div>
              </div>

              <div className="dash-legend-row">
                <div className="dash-legend-left">
                  <span className="dash-legend-dot in_progress"></span>
                  <span>In Progress</span>
                </div>
                <div className="dash-legend-right">
                  <span className="dash-legend-count">{summaryData.inProgress}</span>
                  <span className="dash-legend-pct in_progress">{summaryData.inProgressRate}%</span>
                </div>
              </div>

              <div className="dash-legend-row">
                <div className="dash-legend-left">
                  <span className="dash-legend-dot pending"></span>
                  <span>Pending</span>
                </div>
                <div className="dash-legend-right">
                  <span className="dash-legend-count">{summaryData.pending}</span>
                  <span className="dash-legend-pct pending">{summaryData.pendingRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Progress Action Item Horizontal Bars (3 Status) */}
          <div className="dash-bars-column">
            <h4 className="dash-bars-title">Status Action Item</h4>
            <div className="dash-bars-list">
              {/* Bar 1: Selesai */}
              <div className="dash-bar-row">
                <div className="dash-bar-row-icon selesai">
                  <Check size={13} strokeWidth={3} />
                </div>
                <span className="dash-bar-row-label">Selesai</span>
                <div className="dash-bar-track">
                  <div
                    className="dash-bar-fill selesai"
                    style={{ width: `${summaryData.completionRate}%` }}
                  ></div>
                </div>
                <span className="dash-bar-pct selesai">{summaryData.completionRate}%</span>
              </div>

              {/* Bar 2: In Progress */}
              <div className="dash-bar-row">
                <div className="dash-bar-row-icon in_progress">
                  <PlayCircle size={13} strokeWidth={2.5} />
                </div>
                <span className="dash-bar-row-label">In Progress</span>
                <div className="dash-bar-track">
                  <div
                    className="dash-bar-fill in_progress"
                    style={{ width: `${summaryData.inProgressRate}%` }}
                  ></div>
                </div>
                <span className="dash-bar-pct in_progress">{summaryData.inProgressRate}%</span>
              </div>

              {/* Bar 3: Pending */}
              <div className="dash-bar-row">
                <div className="dash-bar-row-icon pending">
                  <Clock size={13} strokeWidth={2.5} />
                </div>
                <span className="dash-bar-row-label">Pending</span>
                <div className="dash-bar-track">
                  <div
                    className="dash-bar-fill pending"
                    style={{ width: `${summaryData.pendingRate}%` }}
                  ></div>
                </div>
                <span className="dash-bar-pct pending">{summaryData.pendingRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Action Items Table ── */}
      <div className="dash-table-card">
        <div className="dash-table-card-header">
          <div className="dash-table-card-title-group">
            <ListTodo size={18} color="#334155" />
            <h3 className="dash-table-title">
              {scope === 'board'
                ? `Action Item di Board: ${board?.title || 'Board Ini'}`
                : 'Action Item Terbaru (Semua Board)'}
            </h3>
          </div>
          {isLoading && (
            <Loader2 size={16} color="#5956e9" style={{ animation: 'spin 1s linear infinite' }} />
          )}
        </div>

        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th style={{ width: scope === 'board' ? '50%' : '35%' }}>Action Item</th>
                {scope === 'workspace' && <th style={{ width: '20%' }}>Board Asal</th>}
                <th style={{ width: '25%' }}>Assignee</th>
                <th style={{ width: '20%' }}>Status</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredActionItems.length > 0 ? (
                filteredActionItems.map((item) => (
                  <tr key={item.id}>
                    {/* Action Item Title */}
                    <td>
                      <span
                        className={`dash-td-title ${item.status === 'DONE' ? 'is-done' : ''}`}
                      >
                        {item.title}
                      </span>
                    </td>

                    {/* Board Name (hanya jika scope workspace) */}
                    {scope === 'workspace' && (
                      <td>
                        <span
                          className="dash-td-board-tag"
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#5956e9',
                            background: '#f3f0ff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-block',
                          }}
                        >
                          {item.boardName}
                        </span>
                      </td>
                    )}

                    {/* Assignee */}
                    <td>
                      <div className="dash-assignee-cell">
                        <img
                          src={
                            item.assignee?.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.assignee?.name || 'user'}`
                          }
                          alt={item.assignee?.name || 'Assignee'}
                          className="dash-assignee-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.assignee?.name || 'user'}`;
                          }}
                        />
                        <span className="dash-assignee-name">
                          {item.assignee?.name || 'Belum ditugaskan'}
                        </span>
                      </div>
                    </td>

                    {/* Status with Interactive Dropdown Pill */}
                    <td>
                      <DashboardStatusPill
                        status={item.status}
                        itemId={item.id}
                        onChangeStatus={handleUpdateStatus}
                      />
                    </td>

                    {/* Action Menu (3-dots) */}
                    <td className="dash-td-actions">
                      <button
                        type="button"
                        className="dash-action-dot-btn"
                        title="Opsi action item"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={scope === 'workspace' ? 5 : 4} className="dash-empty-table-state">
                    {scope === 'board'
                      ? 'Belum ada action item pada board ini. Buat action item dari kartu retrospective untuk melacak perbaikan tim!'
                      : 'Belum ada action item di workspace ini.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
