import React from 'react';
import { X, Users, CheckCircle2, AlertCircle, ArrowRight, LogIn, UserPlus, Sparkles, Loader2 } from 'lucide-react';
import { getUserAvatar } from '../../utils/avatar';

export default function JoinWorkspaceModal({
  isOpen,
  onClose,
  inviteData,
  isLoading = false,
  error = null,
  currentUser = null,
  onJoin,
  isJoining = false,
  onNavigateLogin,
  onNavigateRegister,
  onStartDemo,
}) {
  if (!isOpen) return null;

  const workspaceName = inviteData?.workspace?.name || 'Workspace';
  const initial = (workspaceName || 'W').charAt(0).toUpperCase();

  return (
    <div className="modal-overlay" onClick={!isJoining ? onClose : undefined} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          padding: '28px 24px',
          borderRadius: '18px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        {!isJoining && (
          <button 
            type="button"
            className="modal-close-btn" 
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px' }}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{ padding: '36px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <Loader2 size={38} color="#5956e9" style={{ animation: 'spin 1s linear infinite' }} />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1e293b' }}>
              Memeriksa Tautan Undangan...
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Sedang mengambil informasi workspace yang mengundang Anda.
            </p>
          </div>
        )}

        {/* Error State (Token Invalid or Expired) */}
        {!isLoading && error && (
          <div style={{ padding: '16px 0' }}>
            <div 
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <AlertCircle size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '19px', fontWeight: 700, color: '#0f172a' }}>
              Tautan Tidak Valid
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
              {error}
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', fontWeight: 600 }}
            >
              Tutup
            </button>
          </div>
        )}

        {/* Valid Invite Preview */}
        {!isLoading && !error && inviteData && (
          <div>
            {/* Workspace Avatar Badge */}
            <div 
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #5956e9 0%, #7c3aed 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
                margin: '0 auto 16px auto',
                boxShadow: '0 10px 20px -5px rgba(89, 86, 233, 0.35)',
              }}
            >
              {initial}
            </div>

            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: '#f5f3ff',
                color: '#5956e9',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '10px',
              }}
            >
              <Users size={14} />
              <span>Undangan Workspace Retro</span>
            </div>

            <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
              {workspaceName}
            </h2>

            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
              Anda diundang untuk bergabung ke workspace tim ini untuk berkolaborasi dalam sesi retrospective.
            </p>

            {/* Condition 1: User is Already Logged In */}
            {currentUser ? (
              <div style={{ marginTop: '20px' }}>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '20px',
                    textAlign: 'left',
                  }}
                >
                  <img 
                    src={currentUser.avatarUrl || getUserAvatar(currentUser)} 
                    alt={currentUser.name} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                      Bergabung sebagai akun:
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {currentUser.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {currentUser.email}
                    </div>
                  </div>
                  <CheckCircle2 size={20} color="#10b981" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isJoining}
                    onClick={onJoin}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: '#5956e9',
                      border: 'none',
                      color: '#ffffff',
                      cursor: isJoining ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Menghubungkan...</span>
                      </>
                    ) : (
                      <>
                        <span>Gabung ke Workspace Sekarang</span>
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={isJoining}
                    onClick={onClose}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    Nanti Saja
                  </button>
                </div>
              </div>
            ) : (
              /* Condition 2: User is NOT Logged In */
              <div style={{ marginTop: '20px' }}>
                <div 
                  style={{
                    backgroundColor: '#f1f5f9',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '18px',
                    fontSize: '13px',
                    color: '#475569',
                    textAlign: 'center',
                  }}
                >
                  Silakan masuk atau daftar akun gratis untuk bergabung ke workspace ini.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      onClose();
                      if (onNavigateLogin) onNavigateLogin();
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: '#5956e9',
                      border: 'none',
                      color: '#ffffff',
                    }}
                  >
                    <LogIn size={16} />
                    <span>Masuk ke Akun Anda</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      onClose();
                      if (onNavigateRegister) onNavigateRegister();
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <UserPlus size={16} />
                    <span>Daftar Akun Baru (Gratis)</span>
                  </button>

                  {onStartDemo && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartDemo();
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'none',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        marginTop: '4px',
                      }}
                    >
                      <Sparkles size={15} color="#5956e9" />
                      <span>Coba Instan dengan Akun Demo</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
