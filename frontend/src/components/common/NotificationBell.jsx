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
} from 'lucide-react';
import { api } from '../../services/api';

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
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.getOverdueNotifications(workspaceId);
      if (res && Array.isArray(res.overdueActions)) {
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

    // Auto-refresh notifications every 45 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 45000);

    return () => clearInterval(interval);
  }, [workspaceId]);

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
      await api.markAllNotificationsRead();
      if (onShowToast) {
        onShowToast('Semua notifikasi telah ditandai dibaca');
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

      // Optimistically remove from overdue list
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      setSelectedItem(null);

      if (onShowToast) {
        onShowToast(`Action item "${item.title}" ditandai sebagai Done ✓`);
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

  const overdueCount = notifications.length;

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
        {overdueCount > 0 ? (
          <span className="notification-badge-count">{overdueCount}</span>
        ) : (
          <span className="notification-badge-dot"></span>
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
                  {overdueCount > 0
                    ? `${overdueCount} action item terlambat`
                    : 'Tidak ada action item terlambat'}
                </span>
              </div>
            </div>
            {overdueCount > 0 && (
              <button
                type="button"
                className="btn-mark-all-read"
                onClick={handleMarkAllRead}
              >
                Tandai semua sudah dibaca
              </button>
            )}
          </div>

          {/* Section: Action item terlambat */}
          <div className="notification-section-heading">
            Action item terlambat
          </div>

          {/* Notification Items List */}
          <div className="notification-list-container">
            {isLoading && notifications.length === 0 ? (
              <div className="notification-empty-state">
                <span>Memuat notifikasi...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty-state">
                <span style={{ fontSize: '20px', marginBottom: '4px' }}>🎉</span>
                <strong>Semua Selesai!</strong>
                <span>Tidak ada action item yang terlambat saat ini.</span>
              </div>
            ) : (
              notifications.map((item) => (
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
              ))
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
              <div className="action-item-summary-top">
                <div className="action-item-title-wrapper">
                  <span className="action-item-red-dot" />
                  <h4 className="action-item-card-heading">{selectedItem.title}</h4>
                </div>
                <span className="action-item-overdue-tag">
                  {selectedItem.overdueBadge || `Terlambat ${selectedItem.overdueDays} hari`}
                </span>
              </div>
              <p className="action-item-card-desc">
                {selectedItem.description || selectedItem.title}
              </p>
            </div>

            {/* Details Section */}
            <div className="action-item-details-body">
              {/* Assigned to */}
              <div className="action-item-field-row">
                <label className="action-item-field-label">Assigned to</label>
                <div className="action-item-assignee-box">
                  <img
                    src={
                      selectedItem.assignee?.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedItem.assignee?.name || 'User'}`
                    }
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

              {/* Due date */}
              <div className="action-item-field-row">
                <label className="action-item-field-label">Due date</label>
                <div className="action-item-duedate-box">
                  <div className="action-item-duedate-text">
                    <Calendar size={15} className="duedate-calendar-icon" />
                    <span>{selectedItem.dueDateDisplay}</span>
                  </div>
                  <span className="action-item-overdue-tag">
                    {selectedItem.overdueBadge || `Terlambat ${selectedItem.overdueDays} hari`}
                  </span>
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
                  {isUpdatingStatus ? 'Memperbarui...' : '✓ Tandai sebagai Done'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
