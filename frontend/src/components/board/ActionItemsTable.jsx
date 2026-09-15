import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Calendar, Check, Trash2, Edit2 } from 'lucide-react';
import { getUserAvatar } from '../../utils/avatar';

function StatusPill({ status, onChangeStatus, itemId }) {
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
  const statusClass = currentStatus.toLowerCase();

  return (
    <div className="action-status-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`action-status-pill ${statusClass}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentStatus === 'IN_PROGRESS' ? 'IN PROGRESS' : currentStatus}</span>
        <span className="action-status-chevron">▼</span>
      </button>
      {isOpen && (
        <div className={`action-status-dropdown ${openUpwards ? 'open-upwards' : ''}`}>
          <button
            type="button"
            className={`action-status-option ${currentStatus === 'PENDING' ? 'active' : ''}`}
            onClick={() => { onChangeStatus(itemId, 'PENDING'); setIsOpen(false); }}
          >
            PENDING
            {currentStatus === 'PENDING' && <Check size={13} />}
          </button>
          <button
            type="button"
            className={`action-status-option ${currentStatus === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => { onChangeStatus(itemId, 'IN_PROGRESS'); setIsOpen(false); }}
          >
            IN PROGRESS
            {currentStatus === 'IN_PROGRESS' && <Check size={13} />}
          </button>
          <button
            type="button"
            className={`action-status-option ${currentStatus === 'DONE' ? 'active' : ''}`}
            onClick={() => { onChangeStatus(itemId, 'DONE'); setIsOpen(false); }}
          >
            DONE
            {currentStatus === 'DONE' && <Check size={13} />}
          </button>
        </div>
      )}
    </div>
  );
}

function ActionItemDueDateCell({ item, onUpdateDueDate }) {
  const [isEditing, setIsEditing] = useState(false);
  const rawDate = item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '';
  const [selectedDate, setSelectedDate] = useState(rawDate);
  const inputRef = useRef(null);

  useEffect(() => {
    setSelectedDate(item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '');
  }, [item.dueDate]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch (err) {
          // ignore if not supported by browser
        }
      }
    }
  }, [isEditing]);

  const handleSave = (newVal) => {
    setIsEditing(false);
    if (newVal !== rawDate) {
      onUpdateDueDate?.(item.id, newVal);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave(selectedDate);
    } else if (e.key === 'Escape') {
      setSelectedDate(rawDate);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="action-item-due-date-edit-wrap" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <input
          ref={inputRef}
          type="date"
          className="action-item-date-input"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            handleSave(e.target.value);
          }}
          onBlur={() => setIsEditing(false)}
          onKeyDown={handleKeyDown}
          style={{
            fontSize: '12.5px',
            padding: '3px 6px',
            border: '1.5px solid #6366f1',
            borderRadius: '6px',
            outline: 'none',
            background: '#ffffff',
            color: '#1e293b',
            boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.15)',
          }}
        />
      </div>
    );
  }

  const displayText =
    item.dueDateDisplay ||
    (item.dueDate
      ? new Date(item.dueDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '– Belum diatur');

  return (
    <button
      type="button"
      className="action-item-due-date action-item-due-date-btn"
      onClick={() => setIsEditing(true)}
      title="Klik untuk mengubah due date"
      style={{
        background: 'transparent',
        border: '1px dashed transparent',
        padding: '4px 8px',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: item.dueDate ? '#374151' : '#94a3b8',
        fontSize: '13px',
        fontWeight: 500,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f1f5f9';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <Calendar size={14} className="action-item-calendar-icon" />
      <span>{displayText}</span>
      <Edit2 size={11} style={{ opacity: 0.45, marginLeft: '2px' }} />
    </button>
  );
}

function ActionItemRow({ item, onChangeStatus, onDelete, onUpdateDueDate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuUpwards, setMenuUpwards] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setMenuUpwards(spaceBelow < 120);
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const isDone = item.status === 'DONE';

  return (
    <tr className={`action-items-row ${isDone ? 'is-done' : ''}`}>
      <td className="action-items-cell action-items-cell-title">
        <span className={`action-item-title-text ${isDone ? 'done-text' : ''}`}>{item.title}</span>
      </td>
      <td className="action-items-cell action-items-cell-assignee">
        <div className="action-item-assignee-info">
          <img
            src={getUserAvatar(item.assignee, item.assignee?.name)}
            alt={item.assignee?.name || 'Assignee'}
            className="action-item-assignee-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getUserAvatar(item.assignee, item.assignee?.name);
            }}
          />
          <span className="action-item-assignee-name">
            {item.assignee?.name || 'Tidak ada'}
          </span>
        </div>
      </td>
      <td className="action-items-cell action-items-cell-due">
        <ActionItemDueDateCell item={item} onUpdateDueDate={onUpdateDueDate} />
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
            <div className={`action-item-menu-dropdown ${menuUpwards ? 'open-upwards' : ''}`}>
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

export default function ActionItemsTable({ actionItems = [], onChangeStatus, onDelete, onUpdateDueDate }) {
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
              onUpdateDueDate={onUpdateDueDate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
