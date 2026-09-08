import React, { useState, useRef, useEffect } from 'react';
import { Clock, Calendar, Check, MoreVertical, Trash2, ChevronUp, Info } from 'lucide-react';

// ── Status Pill (reusable untuk sesi sebelumnya) ──
function PrevStatusPill({ status, onChangeStatus, itemId }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentStatus = status || 'PENDING';
  const statusClass = currentStatus.toLowerCase().replace('_', '-');

  return (
    <div className="prev-status-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`prev-status-pill ${statusClass}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentStatus === 'IN_PROGRESS' ? 'IN PROGRESS' : currentStatus}</span>
        <span className="prev-status-chevron">▼</span>
      </button>
      {isOpen && (
        <div className="prev-status-dropdown">
          {['PENDING', 'IN_PROGRESS', 'DONE'].map((s) => (
            <button
              key={s}
              type="button"
              className={`prev-status-option ${currentStatus === s ? 'active' : ''}`}
              onClick={() => {
                onChangeStatus(itemId, s);
                setIsOpen(false);
              }}
            >
              {s === 'IN_PROGRESS' ? 'IN PROGRESS' : s}
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

  return (
    <tr className="prev-ai-row">
      <td className="prev-ai-cell prev-ai-cell-title">
        <span className="prev-ai-title-text">{item.title}</span>
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
    </tr>
  );
}

// ── Komponen Utama ──
export default function PreviousSessionActionItems({
  items = [],
  sourceBoardName = 'Sprint sebelumnya',
  onChangeStatus,
  onDelete,
}) {
  const [isVisible, setIsVisible] = useState(true);

  // Hanya tampilkan jika ada item
  if (!items || items.length === 0) return null;

  return (
    <div className="prev-session-ai-wrapper">
      {/* ── Header Banner ── */}
      <div className="prev-session-ai-header">
        <div className="prev-session-ai-header-left">
          <div className="prev-session-ai-icon-box">
            <Clock size={22} className="prev-session-ai-icon" />
          </div>
          <div className="prev-session-ai-header-info">
            <h3 className="prev-session-ai-title">Action Item dari Sesi Sebelumnya</h3>
            <p className="prev-session-ai-subtitle">
              Berikut adalah action item yang masih pending dari{' '}
              <strong>{sourceBoardName}</strong> (dalam workspace yang sama).
            </p>
          </div>
        </div>
        <button
          type="button"
          className="prev-session-ai-toggle-btn"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? (
            <>
              <span>Sembunyikan</span>
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              <span>Tampilkan</span>
              <ChevronUp size={14} style={{ transform: 'rotate(180deg)' }} />
            </>
          )}
        </button>
      </div>

      {/* ── Tabel ── */}
      {isVisible && (
        <>
          <div className="prev-session-ai-table-wrapper">
            <table className="prev-session-ai-table">
              <thead>
                <tr className="prev-ai-thead-row">
                  <th className="prev-ai-th prev-ai-th-title">Judul</th>
                  <th className="prev-ai-th prev-ai-th-assignee">Assignee</th>
                  <th className="prev-ai-th prev-ai-th-due">Due Date</th>
                  <th className="prev-ai-th prev-ai-th-status">Status</th>
                  <th className="prev-ai-th prev-ai-th-actions">Aksi</th>
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
              Hanya menampilkan action item yang masih pending dari sesi sebelumnya. Setelah
              diselesaikan, status dapat diubah langsung dari sini
            </span>
          </div>
        </>
      )}
    </div>
  );
}
