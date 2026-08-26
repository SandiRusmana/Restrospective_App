import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

export default function InviteMemberModal({ isOpen, onClose, onInvite, workspaceName }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    onInvite({
      email: email.trim(),
      role: role
    });

    setEmail('');
    setRole('Member');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Undang Anggota ke {workspaceName}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Anggota</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Peran (Role)</label>
            <select 
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
              <option value="Viewer">Viewer (Hanya Lihat)</option>
            </select>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!email.trim()}
            >
              <UserPlus size={16} />
              <span>Kirim Undangan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
