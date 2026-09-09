import React, { useState, useRef, useEffect } from 'react';
import { Clock, Calendar, Check, MoreVertical, Trash2, ChevronUp, Info, Layout } from 'lucide-react';

// ── Status Pill (reusable untuk sesi sebelumnya) ──
function PrevStatusPill({ status, onChangeStatus, itemId }) {
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
        setOpenUpwards(spaceBelow < 160);
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentStatus = status || 'PENDING';
  const statusClass = currentStatus.toLowerCase().replace('_', '-');

  return (
    <div className="prev-status-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`prev-status-pill ${statusClass}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <span>{currentStatus === 'IN_PROGRESS' ? 'IN PROGRESS' : currentStatus}</span>
        <span className="prev-status-chevron">▼</span>
      </button>
      {isOpen && (
        <div className={`prev-status-dropdown ${openUpwards ? 'open-upwards' : ''}`}>
          {['PENDING', 'IN_PROGRESS', 'DONE'].map((s) => (
            <button
              key={s}
              type="button"
              className={`prev-status-option ${currentStatus === s ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatus(itemId, s);
                setIsOpen(false);
              }}
            >
              <span>{s === 'IN_PROGRESS' ? 'IN PROGRESS' : s}</span>
              {currentStatus === s && <Check size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Row per Action Item ──
function PrevActionItemRow({ item, onChangeStatus, onDelete }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const boardTitle = item.boardName || item.board?.name || item.board?.title || 'Sesi Sebelumnya';
  const isDone = item.status === 'DONE';

  return (
    <tr className={`prev-ai-row ${isDone ? 'is-done' : ''}`}>
      <td className="prev-ai-cell prev-ai-cell-title">
        <span className={`prev-ai-title-text ${isDone ? 'done-text' : ''}`}>
          {item.title}
        </span>
      </td>
      <td className="prev-ai-cell prev-ai-cell-board">
        <span className="prev-ai-board-badge" title={boardTitle}>
          <Layout size={12} className="prev-ai-board-icon" />
          <span>{boardTitle}</span>
        </span>
      </td>
      <td className="prev-ai-cell prev-ai-cell-assignee">
        <div className="prev-ai-assignee-info">
          <img
            src={
              item.assignee?.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.assignee?.name || 'user'}`
            }
            alt={item.assignee?.name || 'Assignee'}
            className="prev-ai-assignee-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.assignee?.name || 'user'}`;
            }}
          />
          <span className="prev-ai-assignee-name">
            {item.assignee?.name || 'Tidak ada'}
          </span>
        </div>
      </td>
      <td className="prev-ai-cell prev-ai-cell-due">
        <div className="prev-ai-due-date">
          <Calendar size={14} className="prev-ai-calendar-icon" />
          <span>{item.dueDateDisplay || item.dueDate || '–'}</span>
        </div>
      </td>
      <td className="prev-ai-cell prev-ai-cell-status">
        <PrevStatusPill
          status={item.status || 'PENDING'}
          onChangeStatus={onChangeStatus}
          itemId={item.id}
        />
      </td>
      {onDelete && (
        <td className="prev-ai-cell prev-ai-cell-actions">
          <div className="prev-ai-actions-wrapper" ref={menuRef}>
            <button
              type="button"
              className="prev-ai-menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Opsi action item sesi sebelumnya"
            >
              <MoreVertical size={18} />
            </button>
            {isMenuOpen && (
              <div className="prev-ai-menu-dropdown">
                <button
                  type="button"
                  className="prev-ai-menu-option prev-ai-menu-option-delete"
                  onClick={() => {
                    onDelete(item.id);
                    setIsMenuOpen(false);
                  }}
                >
                  <Trash2 size={14} />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

// ── Komponen Utama ──
export default function PreviousSessionActionItems({
  items = [],
  onChangeStatus,
  onDelete,
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const pendingCount = items.filter((i) => i.status !== 'DONE').length;

  // Auto-dismiss setelah jeda 2-3 detik ketika semua item berstatus DONE
  useEffect(() => {
    if (items.length > 0 && pendingCount === 0) {
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 2000);

      const dismissTimer = setTimeout(() => {
        setIsDismissed(true);
      }, 2500);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(dismissTimer);
      };
    } else {
      setIsFadingOut(false);
      setIsDismissed(false);
    }
  }, [pendingCount, items.length]);

  // Hanya tampilkan jika ada item dan belum di-dismiss otomatis
  if (isDismissed || !items || items.length === 0) return null;

  // ── Mode Kompak Ramping (Saat Disembunyikan) ──
  if (!isVisible) {
    return (
      <div
        className={`prev-session-ai-compact ${isFadingOut ? 'fade-out' : ''}`}
        onClick={() => setIsVisible(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsVisible(true)}
      >
        <div className="prev-session-ai-compact-left">
          <div className="prev-session-ai-compact-icon-box">
            <Clock size={16} className="prev-session-ai-compact-icon" />
          </div>
          <span className="prev-session-ai-compact-text">
            <strong>{pendingCount} action item</strong> dari sesi sebelumnya belum selesai
          </span>
          {pendingCount > 0 ? (
            <span className="prev-session-badge prev-session-badge-pending">
              {pendingCount} Belum Selesai
            </span>
          ) : (
            <span className="prev-session-badge prev-session-badge-done">
              Semua Selesai 🎉 (Menutup...)
            </span>
          )}
        </div>
        <button
          type="button"
          className="prev-session-ai-compact-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(true);
          }}
        >
          <span>Buka Review</span>
          <ChevronUp size={14} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
    );
  }

  return (
    <div className={`prev-session-ai-wrapper ${isFadingOut ? 'fade-out' : ''}`}>
      {/* ── Header Banner ── */}
      <div className="prev-session-ai-header">
        <div className="prev-session-ai-header-left">
          <div className="prev-session-ai-icon-box">
            <Clock size={22} className="prev-session-ai-icon" />
          </div>
          <div className="prev-session-ai-header-info">
            <div className="prev-session-ai-title-row">
              <h3 className="prev-session-ai-title">Action Item dari Sesi Sebelumnya</h3>
              {pendingCount > 0 ? (
                <span className="prev-session-badge prev-session-badge-pending">
                  {pendingCount} Belum Selesai
                </span>
              ) : (
                <span className="prev-session-badge prev-session-badge-done">
                  Semua Selesai 🎉 (Menutup...)
                </span>
              )}
            </div>
            <p className="prev-session-ai-subtitle">
              {pendingCount === 0
                ? 'Semua action item sesi sebelumnya telah diselesaikan! Banner ini akan menutup otomatis...'
                : 'Berikut adalah action item yang masih pending dari sesi retrospective sebelumnya (dalam workspace yang sama).'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="prev-session-ai-toggle-btn"
          onClick={() => setIsVisible(false)}
        >
          <span>Sembunyikan</span>
          <ChevronUp size={14} />
        </button>
      </div>

      {/* ── Tabel ── */}
      <div className="prev-session-ai-table-wrapper">
        <table className="prev-session-ai-table">
          <thead>
            <tr className="prev-ai-thead-row">
              <th className="prev-ai-th prev-ai-th-title">Judul</th>
              <th className="prev-ai-th prev-ai-th-board">Board Asal</th>
              <th className="prev-ai-th prev-ai-th-assignee">Assignee</th>
              <th className="prev-ai-th prev-ai-th-due">Due Date</th>
              <th className="prev-ai-th prev-ai-th-status">Status</th>
              {onDelete && <th className="prev-ai-th prev-ai-th-actions">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <PrevActionItemRow
                key={item.id}
                item={item}
                onChangeStatus={onChangeStatus}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Info Footer ── */}
      <div className="prev-session-ai-info-bar">
        <Info size={14} className="prev-session-ai-info-icon" />
        <span>
          {pendingCount === 0
            ? 'Hebat! Semua action item sesi sebelumnya sudah tuntas dikerjakan.'
            : 'Hanya menampilkan action item yang belum selesai dari sesi sebelumnya. Setelah diselesaikan, status dapat diubah langsung dari sini.'}
        </span>
      </div>
    </div>
  );
}
