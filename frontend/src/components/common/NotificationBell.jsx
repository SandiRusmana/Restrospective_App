import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Rocket,
  ChevronRight,
  X,
  Calendar,
  Check,
  Clock,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  Edit2,
  AlertTriangle,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { getUserAvatar } from '../../utils/avatar';

export default function NotificationBell({
  workspaceId,
  currentUser,
  onNavigateActionItems,
  onOpenBoard,
  onShowToast,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [editDueDateValue, setEditDueDateValue] = useState('');
  const [isSavingDueDate, setIsSavingDueDate] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.getOverdueNotifications(workspaceId);
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      } else if (res && Array.isArray(res.overdueActions)) {
        setNotifications(res.overdueActions);
      } else if (Array.isArray(res)) {
        setNotifications(res);
      }
    } catch (err) {
      console.error('Gagal mengambil data notifikasi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [workspaceId]);

  useEffect(() => {
    if (selectedItem) {
      setEditDueDateValue(selectedItem.dueDate ? String(selectedItem.dueDate).substring(0, 10) : '');
      setIsEditingDueDate(false);
    }
  }, [selectedItem]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      setNotifications([]);
      setIsOpen(false);
      await api.markAllNotificationsRead();
      if (onShowToast) {
        onShowToast('Semua notifikasi ditandai sebagai sudah dibaca');
      }
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleMarkAsDone = async (item) => {
    if (!item || !item.id) return;
    try {
      setIsUpdatingStatus(true);
      await api.updateActionItem(item.id, { status: 'DONE' });

      // Optimistically remove from list
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      setSelectedItem(null);

      if (onShowToast) {
        onShowToast(`Action item "${item.title}" ditandai sebagai Done`);
      }
    } catch (err) {
      console.error('Gagal memperbarui status action item:', err);
      if (onShowToast) {
        onShowToast('Gagal memperbarui status action item');
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveDueDate = async () => {
    if (!selectedItem) return;
    try {
      setIsSavingDueDate(true);
      const isoDate = editDueDateValue ? new Date(editDueDateValue).toISOString() : null;
      await api.updateActionItem(selectedItem.id, { dueDate: isoDate });

      const now = new Date();
      const hasDate = Boolean(editDueDateValue);
      const newD = hasDate ? new Date(editDueDateValue) : null;
      const isOverdue = Boolean(newD && newD.getTime() < now.getTime());
      const dueDateDisplay = newD
        ? newD.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Belum ditentukan';

      let overdueDays = 0;
      let overdueBadge = 'Ditugaskan';
      if (isOverdue && newD) {
        const diffMs = now.getTime() - newD.getTime();
        overdueDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        overdueBadge = `Terlambat ${overdueDays} hari`;
      } else if (hasDate && newD) {
        const diffMs = newD.getTime() - now.getTime();
        const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        overdueBadge = remainingDays <= 0 ? 'Hari ini' : `${remainingDays} hari lagi`;
      }

      const updated = {
        ...selectedItem,
        dueDate: isoDate,
        dueDateDisplay,
        isOverdue,
        overdueDays,
        overdueBadge,
        type: isOverdue ? 'OVERDUE' : 'ASSIGNED',
      };

      setSelectedItem(updated);
      setNotifications((prev) =>
        prev.map((n) => (n.id === selectedItem.id ? updated : n))
      );
      setIsEditingDueDate(false);
      if (onShowToast) onShowToast('Tenggat waktu berhasil diperbarui');
    } catch (err) {
      console.error('Gagal memperbarui due date:', err);
      if (onShowToast) onShowToast('Gagal memperbarui tenggat waktu');
    } finally {
      setIsSavingDueDate(false);
    }
  };

  const overdueItems = notifications.filter((n) => n.type === 'OVERDUE' || n.isOverdue);
  const assignedItems = notifications.filter((n) => n.type === 'ASSIGNED' && !n.isOverdue);
  const totalCount = notifications.length;

  return (
    <div className={`notification-bell-wrapper ${className}`} ref={dropdownRef}>
      {/* ── Bell Icon Button with Badge ── */}
      <button
        type="button"
        className="btn-icon-top notification-btn"
        title="Notifikasi"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Bell size={18} />
        {totalCount > 0 && (
          <span className="notification-badge-count">{totalCount}</span>
        )}
      </button>

      {/* ── Dropdown Popup (Mockup 1) ── */}
      {isOpen && (
        <div className="notification-dropdown-popup">
          {/* Header */}
          <div className="notification-dropdown-header">
            <div className="notification-header-left">
              <div className="notification-rocket-icon">
                <Rocket size={18} color="#6366f1" />
              </div>
              <div className="notification-header-titles">
                <h3 className="notification-title">Notifikasi</h3>
                <span className="notification-subtitle">
                  {totalCount > 0
                    ? `${overdueItems.length} terlambat • ${assignedItems.length} ditugaskan`
                    : 'Tidak ada notifikasi baru'}
                </span>
              </div>
            </div>
            {totalCount > 0 && (
              <button
                type="button"
                className="btn-mark-all-read"
                onClick={handleMarkAllRead}
              >
                Tandai dibaca
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div className="notification-list-container">
            {isLoading && notifications.length === 0 ? (
              <div className="notification-empty-state">
                <span>Memuat notifikasi...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty-state">
                <CheckCircle2 size={28} color="#10b981" style={{ marginBottom: '6px' }} />
                <strong>Semua Selesai!</strong>
                <span>Tidak ada action item pending atau terlambat saat ini.</span>
              </div>
            ) : (
              <>
                {/* 1. Group: Action Item Terlambat */}
                {overdueItems.length > 0 && (
                  <div className="notification-group-section" style={{ marginBottom: '8px' }}>
                    <div className="notification-section-heading" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} />
                      <span>Action item terlambat ({overdueItems.length})</span>
                    </div>
                    {overdueItems.map((item) => (
                      <div
                        key={item.id}
                        className="notification-item-card"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsOpen(false);
                        }}
                      >
                        <div className="notification-item-left">
                          <span className="notification-red-dot" />
                          <div className="notification-item-info">
                            <div className="notification-item-title-row">
                              <h4 className="notification-item-title">{item.title}</h4>
                            </div>
                            <div className="notification-item-meta">
                              <Calendar size={12} className="meta-icon" />
                              <span>{item.boardTitle} • {item.dueDateDisplay}</span>
                            </div>
                          </div>
                        </div>

                        <div className="notification-item-right">
                          <span className="notification-overdue-pill">
                            {item.overdueBadge || `Terlambat ${item.overdueDays} hari`}
                          </span>
                          <ChevronRight size={16} className="notification-chevron" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Group: Ditugaskan ke Anda */}
                {assignedItems.length > 0 && (
                  <div className="notification-group-section">
                    <div className="notification-section-heading" style={{ color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Target size={14} />
                      <span>Ditugaskan ke Anda ({assignedItems.length})</span>
                    </div>
                    {assignedItems.map((item) => (
                      <div
                        key={item.id}
                        className="notification-item-card"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsOpen(false);
                        }}
                      >
                        <div className="notification-item-left">
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1', flexShrink: 0, marginTop: '5px' }} />
                          <div className="notification-item-info">
                            <div className="notification-item-title-row">
                              <h4 className="notification-item-title">{item.title}</h4>
                            </div>
                            <div className="notification-item-meta">
                              <Calendar size={12} className="meta-icon" />
                              <span>{item.boardTitle} • {item.dueDateDisplay}</span>
                            </div>
                          </div>
                        </div>

                        <div className="notification-item-right">
                          <span style={{ backgroundColor: '#eef2ff', color: '#4f46e5', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px' }}>
                            {item.overdueBadge || 'Ditugaskan'}
                          </span>
                          <ChevronRight size={16} className="notification-chevron" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="notification-dropdown-footer">
            <button
              type="button"
              className="btn-view-all-actions"
              onClick={() => {
                setIsOpen(false);
                if (onNavigateActionItems) {
                  onNavigateActionItems();
                } else if (onShowToast) {
                  onShowToast('Membuka daftar action item');
                }
              }}
            >
              <span>Lihat semua action item</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Action Item Detail Modal (Mockup 2) ── */}
      {selectedItem && (
        <div
          className="action-item-modal-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="action-item-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="action-item-modal-header">
              <h3 className="action-item-modal-title">Action Item</h3>
              <button
                type="button"
                className="btn-action-modal-close"
                onClick={() => setSelectedItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Upper Highlight Card */}
            <div className="action-item-summary-card">
              <h4 className="action-item-summary-title">{selectedItem.title}</h4>
              <p className="action-item-summary-board">Board: {selectedItem.boardTitle}</p>
            </div>

            {/* Details Section */}
            <div className="action-item-details-body">
              {/* Assigned to */}
              <div className="action-item-field-row">
                <label className="action-item-field-label">Assigned to</label>
                <div className="action-item-assignee-box">
                  <img
                    src={getUserAvatar(selectedItem.assignee, selectedItem.assignee?.name)}
                    alt={selectedItem.assignee?.name || 'Assignee'}
                    className="action-item-assignee-avatar"
                  />
                  <div className="action-item-assignee-text">
                    <span className="action-item-assignee-name">
                      {selectedItem.assignee?.name || 'Anggota Tim'}
                    </span>
                    <span className="action-item-assignee-role">
                      {selectedItem.assignee?.role || selectedItem.workspaceName || 'Member'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Due date (Dapat Diedit Langsung) */}
              <div className="action-item-field-row">
                <label className="action-item-field-label">Due date</label>
                <div className="action-item-duedate-box">
                  {isEditingDueDate ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <input
                        type="date"
                        value={editDueDateValue}
                        onChange={(e) => setEditDueDateValue(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: '1px solid #6366f1',
                          borderRadius: '6px',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveDueDate}
                        disabled={isSavingDueDate}
                        style={{
                          backgroundColor: '#4f46e5',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isSavingDueDate ? '...' : 'Simpan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDueDate(false)}
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div className="action-item-duedate-text">
                        <Calendar size={15} className="duedate-calendar-icon" />
                        <span>{selectedItem.dueDateDisplay}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className={selectedItem.isOverdue ? 'action-item-overdue-tag' : 'action-item-assigned-tag'}
                          style={!selectedItem.isOverdue ? { backgroundColor: '#eef2ff', color: '#4f46e5', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 } : undefined}
                        >
                          {selectedItem.overdueBadge || (selectedItem.isOverdue ? `Terlambat ${selectedItem.overdueDays} hari` : 'Ditugaskan')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditDueDateValue(selectedItem.dueDate ? String(selectedItem.dueDate).substring(0, 10) : '');
                            setIsEditingDueDate(true);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'transparent',
                            border: 'none',
                            color: '#4f46e5',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '4px 6px',
                          }}
                          title="Ubah batas waktu"
                        >
                          <Edit2 size={13} />
                          <span>Ubah</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="action-item-field-row">
                <label className="action-item-field-label">Status</label>
                <div className="action-item-status-wrapper">
                  <span className={`action-item-status-pill status-${(selectedItem.status || 'pending').toLowerCase()}`}>
                    ● {selectedItem.status || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Komentar */}
              <div className="action-item-field-row">
                <label className="action-item-field-label">Komentar</label>
                <div className="action-item-comments-empty">
                  <MessageSquare size={15} className="comment-icon" />
                  <span>
                    {selectedItem.commentsCount > 0
                      ? `${selectedItem.commentsCount} komentar`
                      : 'Belum ada komentar'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Action Button */}
            <div className="action-item-modal-footer">
              <button
                type="button"
                className="btn-mark-action-done"
                disabled={isUpdatingStatus}
                onClick={() => handleMarkAsDone(selectedItem)}
              >
                <Check size={17} strokeWidth={2.5} />
                <span>
                  {isUpdatingStatus ? 'Memperbarui...' : 'Tandai sebagai Done'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
