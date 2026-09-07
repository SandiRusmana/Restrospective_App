import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Calendar, Check, Trash2, Edit2 } from 'lucide-react';

function StatusPill({ status, onChangeStatus, itemId }) {
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

  const isDone = status === 'DONE';

  return (
    <div className="action-status-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`action-status-pill ${isDone ? 'done' : 'pending'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{status}</span>
        <span className="action-status-chevron">▼</span>
      </button>
      {isOpen && (
        <div className="action-status-dropdown">
          <button
            type="button"
            className={`action-status-option ${!isDone ? 'active' : ''}`}
            onClick={() => { onChangeStatus(itemId, 'PENDING'); setIsOpen(false); }}
          >
            PENDING
            {!isDone && <Check size={13} />}
          </button>
          <button
            type="button"
            className={`action-status-option ${isDone ? 'active' : ''}`}
            onClick={() => { onChangeStatus(itemId, 'DONE'); setIsOpen(false); }}
          >
            DONE
            {isDone && <Check size={13} />}
          </button>
        </div>
      )}
    </div>
  );
}

function ActionItemRow({ item, onChangeStatus, onDelete }) {
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
    <tr className="action-items-row">
      <td className="action-items-cell action-items-cell-title">
        <span className="action-item-title-text">{item.title}</span>
      </td>
      <td className="action-items-cell action-items-cell-assignee">
        <div className="action-item-assignee-info">
          <img
            src={
              item.assignee?.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.assignee?.name || 'user'}`
            }
            alt={item.assignee?.name || 'Assignee'}
            className="action-item-assignee-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.assignee?.name || 'user'}`;
            }}
          />
          <span className="action-item-assignee-name">
            {item.assignee?.name || 'Tidak ada'}
          </span>
        </div>
      </td>
      <td className="action-items-cell action-items-cell-due">
        <div className="action-item-due-date">
          <Calendar size={14} className="action-item-calendar-icon" />
          <span>{item.dueDateDisplay || item.dueDate || '–'}</span>
        </div>
      </td>
      <td className="action-items-cell action-items-cell-status">
        <StatusPill
          status={item.status || 'PENDING'}
          onChangeStatus={onChangeStatus}
          itemId={item.id}
        />
      </td>
      <td className="action-items-cell action-items-cell-actions">
        <div className="action-item-actions-wrapper" ref={menuRef}>
          <button
            type="button"
            className="action-item-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Opsi action item"
          >
            <MoreVertical size={18} />
          </button>
          {isMenuOpen && (
            <div className="action-item-menu-dropdown">
              <button
                type="button"
                className="action-item-menu-option action-item-menu-option-delete"
                onClick={() => { onDelete(item.id); setIsMenuOpen(false); }}
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

export default function ActionItemsTable({ actionItems = [], onChangeStatus, onDelete }) {
  if (actionItems.length === 0) {
    return (
      <div className="action-items-empty">
        <div className="action-items-empty-icon">✅</div>
        <h3 className="action-items-empty-title">Belum ada Action Item</h3>
        <p className="action-items-empty-desc">
          Konversi kartu retro menjadi action item menggunakan menu <strong>Convert To Action Item</strong> pada kartu.
        </p>
      </div>
    );
  }

  return (
    <div className="action-items-table-container">
      <table className="action-items-table">
        <thead>
          <tr className="action-items-thead-row">
            <th className="action-items-th action-items-th-title">Judul</th>
            <th className="action-items-th action-items-th-assignee">Assignee</th>
            <th className="action-items-th action-items-th-due">Due Date</th>
            <th className="action-items-th action-items-th-status">Status</th>
            <th className="action-items-th action-items-th-actions">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {actionItems.map((item) => (
            <ActionItemRow
              key={item.id}
              item={item}
              onChangeStatus={onChangeStatus}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
