import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Building2,
  Users,
  Bell,
  Save,
  Trash2,
  Check,
  ShieldCheck,
  Mail,
  Loader2,
  Sparkles,
  Volume2,
  VolumeX,
  Camera,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import { WORKSPACE_PALETTE } from '../../utils/workspaceColor';
import { playChime } from '../../utils/sound';

const AVATAR_SEEDS = [
  'Felix',
  'Aneka',
  'Oliver',
  'Jasmine',
  'Leo',
  'Sara',
  'Adrian',
  'Mila',
];

// Helper: Kompres dan crop gambar kustom ke format avatar kotak tajam dan ringan
const compressImage = (file, maxWidth = 256, maxHeight = 256, quality = 0.88) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Crop center square
        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        const targetSize = Math.min(size, maxWidth);
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, startX, startY, size, size, 0, 0, targetSize, targetSize);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = readerEvent.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function SettingsView({
  currentUser,
  workspace,
  onUpdateUser,
  onUpdateWorkspace,
  onDeleteWorkspace,
  onInviteMember,
  onShowToast,
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'workspace' | 'members' | 'preferences'

  // User Profile Form State
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState(currentUser?.name || 'Felix');
  const [customAvatarUrl, setCustomAvatarUrl] = useState(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const fileInputRef = useRef(null);

  // Workspace Form State
  const [wsName, setWsName] = useState(workspace?.name || '');
  const [wsDescription, setWsDescription] = useState(
    workspace?.description || workspace?.longDescription || ''
  );
  const [wsColor, setWsColor] = useState(workspace?.color || '#5b52f9');
  const [isSavingWs, setIsSavingWs] = useState(false);

  // Preferences State
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('retro_pref_sound') !== 'false';
  });
  const [pusherAlerts, setPusherAlerts] = useState(() => {
    return localStorage.getItem('retro_pref_pusher_alert') !== 'false';
  });

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setUserName(currentUser.name);
      if (currentUser.avatarUrl) {
        if (currentUser.avatarUrl.startsWith('data:image/') || !currentUser.avatarUrl.includes('dicebear.com')) {
          setCustomAvatarUrl(currentUser.avatarUrl);
        } else {
          setCustomAvatarUrl(null);
          const match = currentUser.avatarUrl.match(/seed=([^&]+)/);
          if (match && match[1]) {
            setSelectedAvatarSeed(decodeURIComponent(match[1]));
          } else if (currentUser.name) {
            setSelectedAvatarSeed(currentUser.name);
          }
        }
      } else if (currentUser.name) {
        setSelectedAvatarSeed(currentUser.name);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (workspace) {
      setWsName(workspace.name || '');
      setWsDescription(workspace.description || workspace.longDescription || '');
      setWsColor(workspace.color || '#5b52f9');
    }
  }, [workspace]);

  // Handler: Upload Foto Kustom
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (onShowToast) onShowToast('Silakan pilih file gambar yang valid (JPG, PNG, WebP)');
      return;
    }

    try {
      const resizedDataUrl = await compressImage(file, 256, 256, 0.88);
      setCustomAvatarUrl(resizedDataUrl);
      if (onShowToast) onShowToast('Foto berhasil dimuat! Klik "Simpan Profil" untuk menerapkan.');
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
      if (onShowToast) onShowToast('Gagal memproses gambar yang dipilih');
    }
  };

  // Handler: Save User Profile
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!userName.trim()) {
      if (onShowToast) onShowToast('Nama pengguna tidak boleh kosong');
      return;
    }

    setIsSavingUser(true);
    const newAvatarUrl = customAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatarSeed}&mouth=smile,twinkle&eyes=default,happy,wink`;
    try {
      localStorage.setItem('retro_user_avatar', newAvatarUrl);
    } catch {}

    try {
      await api.updateProfile({
        name: userName.trim(),
        avatarUrl: newAvatarUrl,
      });

      if (onUpdateUser) {
        onUpdateUser({
          ...currentUser,
          name: userName.trim(),
          fullName: `${userName.trim()} (Anda)`,
          avatarUrl: newAvatarUrl,
        });
      }

      if (onShowToast) onShowToast('Profil berhasil disimpan!');
    } catch (err) {
      console.error('Gagal simpan profil:', err);
      // Tetap update state lokal agar user experience mulus
      if (onUpdateUser) {
        onUpdateUser({
          ...currentUser,
          name: userName.trim(),
          fullName: `${userName.trim()} (Anda)`,
          avatarUrl: newAvatarUrl,
        });
      }
      if (onShowToast) onShowToast('Profil diperbarui di tampilan');
    } finally {
      setIsSavingUser(false);
    }
  };

  // Handler: Save Workspace Settings
  const handleSaveWorkspaceSettings = async (e) => {
    if (e) e.preventDefault();
    if (!wsName.trim() || !workspace?.id) return;

    setIsSavingWs(true);
    try {
      if (onUpdateWorkspace) {
        await onUpdateWorkspace(workspace.id, {
          name: wsName.trim(),
          description: wsDescription.trim(),
          color: wsColor,
        });
      }
      if (onShowToast) onShowToast('Pengaturan workspace berhasil disimpan!');
    } catch (err) {
      console.error('Gagal update workspace:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal menyimpan workspace');
    } finally {
      setIsSavingWs(false);
    }
  };

  // Handler: Toggle Preferences
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('retro_pref_sound', String(next));
    if (next) {
      playChime('preview');
    }
    if (onShowToast) onShowToast(next ? 'Efek suara diaktifkan' : 'Efek suara dimatikan');
  };

  const handleTogglePusherAlerts = () => {
    const next = !pusherAlerts;
    setPusherAlerts(next);
    localStorage.setItem('retro_pref_pusher_alert', String(next));
    if (onShowToast) onShowToast(next ? 'Notifikasi realtime diaktifkan' : 'Notifikasi realtime dinonaktifkan');
  };

  const isWorkspaceOwner =
    workspace?.ownerId === currentUser?.id ||
    workspace?.role?.toLowerCase() === 'owner' ||
    workspace?.members?.some(
      (m) => (m.id === currentUser?.id || m.userId === currentUser?.id) && m.role?.toLowerCase() === 'owner'
    );

  return (
    <div className="settings-view-container">
      {/* Header Banner */}
      <header className="settings-view-header">
        <div>
          <h1 className="settings-header-title">Pengaturan</h1>
          <p className="settings-header-desc">
            Kelola profil akun Anda, konfigurasi workspace, anggota tim, serta preferensi aplikasi RetroNerve.
          </p>
        </div>
      </header>

      {/* Main Settings Layout (Sidebar Tabs + Content Area) */}
      <div className="settings-layout-card">
        <aside className="settings-nav-sidebar">
          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>Profil Akun</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            <Building2 size={18} />
            <span>Workspace</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={18} />
            <span>Anggota Tim</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Bell size={18} />
            <span>Preferensi</span>
          </button>
        </aside>

        <main className="settings-content-pane">
          {/* TAB 1: User Profile Settings */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="settings-section-form">
              <div className="settings-section-header">
                <h2>Profil Pengguna</h2>
                <p>Ubah informasi akun dan avatar representasi Anda dalam sesi retrospective.</p>
              </div>

              {/* Avatar Preview & Seed Selection */}
              <div className="settings-avatar-selector-block" style={{ alignItems: 'flex-start', gap: '20px' }}>
                <div 
                  className="settings-current-avatar-container"
                  onClick={() => fileInputRef.current?.click()}
                  title="Klik untuk ganti atau upload foto sendiri"
                  style={{
                    position: 'relative',
                    width: '88px',
                    height: '88px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    flexShrink: 0,
                    overflow: 'hidden',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                    border: '3px solid #ffffff',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <img
                    src={
                      customAvatarUrl || 
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatarSeed}&mouth=smile,twinkle&eyes=default,happy,wink`
                    }
                    alt="Current Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {/* Modern Hover Overlay */}
                  <div 
                    className="avatar-hover-layer"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      gap: '2px',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  >
                    <Camera size={20} />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>Ganti</span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="settings-avatar-seeds-wrap" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <label className="settings-label" style={{ margin: 0, fontSize: '13.5px', fontWeight: 600 }}>
                      {customAvatarUrl ? 'Foto Kustom Digunakan:' : 'Pilih Karakter Ceria atau Upload Sendiri:'}
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Upload size={14} />
                        <span>Upload Foto Sendiri</span>
                      </button>
                      {customAvatarUrl && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setCustomAvatarUrl(null)}
                          style={{ fontSize: '12px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b' }}
                          title="Kembali ke karakter kartun"
                        >
                          <RotateCcw size={13} />
                          <span>Gunakan Kartun</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="settings-avatar-seeds-grid">
                    {AVATAR_SEEDS.map((seed) => (
                      <button
                        key={seed}
                        type="button"
                        className={`settings-avatar-seed-btn ${!customAvatarUrl && selectedAvatarSeed === seed ? 'selected' : ''}`}
                        onClick={() => {
                          setCustomAvatarUrl(null);
                          setSelectedAvatarSeed(seed);
                        }}
                        title={`Pilih karakter ${seed}`}
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          border: (!customAvatarUrl && selectedAvatarSeed === seed) ? '2.5px solid #5956e9' : '2px solid transparent',
                          padding: 0,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                        }}
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&mouth=smile,twinkle&eyes=default,happy,wink`}
                          alt={seed}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </button>
                    ))}
                  </div>

                  {customAvatarUrl && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Check size={14} />
                      <span>Foto kustom terpilih. Klik "Simpan Profil" untuk menerapkan.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Name Field */}
              <div className="settings-form-group">
                <label className="settings-label" htmlFor="settings-username">
                  Nama Tampilan:
                </label>
                <input
                  id="settings-username"
                  type="text"
                  className="settings-input"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda..."
                  required
                />
              </div>

              {/* Email Field (Readonly) */}
              <div className="settings-form-group">
                <label className="settings-label" htmlFor="settings-email">
                  Alamat Email:
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="settings-email"
                    type="email"
                    className="settings-input settings-input-readonly"
                    value={currentUser?.email || 'user@example.com'}
                    readOnly
                  />
                  <div className="settings-verified-badge" title="Akun Terverifikasi">
                    <ShieldCheck size={14} />
                    <span>Terverifikasi</span>
                  </div>
                </div>
                <span className="settings-input-help">Email digunakan untuk login dan tidak dapat diubah sembarangan.</span>
              </div>

              <div className="settings-form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingUser}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSavingUser ? <Loader2 size={16} className="btn-export-spinner" /> : <Save size={16} />}
                  <span>{isSavingUser ? 'Menyimpan...' : 'Simpan Profil'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Workspace Settings */}
          {activeTab === 'workspace' && (
            <form onSubmit={handleSaveWorkspaceSettings} className="settings-section-form">
              <div className="settings-section-header">
                <h2>Pengaturan Workspace</h2>
                <p>Konfigurasi nama, identitas, dan deskripsi workspace aktif.</p>
              </div>

              <div className="settings-form-group">
                <label className="settings-label" htmlFor="settings-ws-name">
                  Nama Workspace:
                </label>
                <input
                  id="settings-ws-name"
                  type="text"
                  className="settings-input"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="Misal: Mobile Team, Web Platform..."
                  required
                />
              </div>

              <div className="settings-form-group">
                <label className="settings-label" htmlFor="settings-ws-desc">
                  Deskripsi Tim:
                </label>
                <textarea
                  id="settings-ws-desc"
                  className="settings-textarea"
                  rows={3}
                  value={wsDescription}
                  onChange={(e) => setWsDescription(e.target.value)}
                  placeholder="Deskripsi kegiatan atau fokus tim ini..."
                />
              </div>

              <div className="settings-form-group">
                <label className="settings-label">
                  Warna Ikon Identitas:
                </label>
                <div className="color-options" style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {WORKSPACE_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-circle ${wsColor === c ? 'active' : ''}`}
                      style={{
                        backgroundColor: c,
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: wsColor === c ? '3px solid #0f172a' : '2px solid transparent',
                        boxShadow: wsColor === c ? '0 0 0 2px #fff inset' : 'none',
                        transition: 'transform 0.15s ease'
                      }}
                      onClick={() => setWsColor(c)}
                      title={`Pilih warna ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div className="settings-form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingWs}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSavingWs ? <Loader2 size={16} className="btn-export-spinner" /> : <Save size={16} />}
                  <span>{isSavingWs ? 'Menyimpan...' : 'Simpan Workspace'}</span>
                </button>
              </div>

              {/* Danger Zone: Delete Workspace (Owner Only) */}
              {isWorkspaceOwner && workspace && (
                <div className="settings-danger-zone">
                  <div className="settings-danger-info">
                    <h3>Zona Berbahaya: Hapus Workspace</h3>
                    <p>
                      Menghapus workspace <strong>"{workspace.name}"</strong> akan menghapus permanen seluruh board,
                      kartu catatan, dan riwayat action item di dalamnya.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Apakah Anda yakin ingin menghapus workspace "${workspace.name}" beserta seluruh board di dalamnya?`
                        )
                      ) {
                        if (onDeleteWorkspace) onDeleteWorkspace(workspace.id, workspace.name);
                      }
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={16} />
                    <span>Hapus Workspace Ini</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* TAB 3: Team Members Management */}
          {activeTab === 'members' && (
            <div className="settings-section-form">
              <div className="settings-section-header-row">
                <div>
                  <h2>Anggota Workspace ({workspace?.members?.length || 1})</h2>
                  <p>Daftar anggota tim yang memiliki hak akses kolaborasi pada sesi retrospective ini.</p>
                </div>
                {onInviteMember && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onInviteMember}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <Users size={15} />
                    <span>+ Undang Anggota</span>
                  </button>
                )}
              </div>

              <div className="settings-members-list">
                {(workspace?.members || []).map((m, idx) => (
                  <div key={m.id || idx} className="settings-member-item">
                    <img
                      src={
                        Boolean((currentUser?.id && (m.id === currentUser.id || m.userId === currentUser.id)) || (currentUser?.email && m.email === currentUser.email))
                          ? (currentUser?.avatarUrl || m.avatarUrl || m.avatar)
                          : (m.avatarUrl || m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name || m.email || idx}`)
                      }
                      alt={m.name}
                      className="settings-member-avatar"
                    />
                    <div className="settings-member-info">
                      <div className="settings-member-name-row">
                        <span className="settings-member-name">{m.name}</span>
                        <span className={`settings-role-badge ${(m.role || 'member').toLowerCase()}`}>
                          {m.role || 'Member'}
                        </span>
                      </div>
                      <span className="settings-member-email">{m.email || 'Belum ada email'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Preferences & Notifications */}
          {activeTab === 'preferences' && (
            <div className="settings-section-form">
              <div className="settings-section-header">
                <h2>Preferensi & Suara</h2>
                <p>Sesuaikan pengalaman interaksi sesi retro dan notifikasi aplikasi.</p>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-title">Efek Suara Sesi</div>
                  <div className="settings-toggle-desc">
                    Memutar nada notifikasi saat timer retro berakhir atau pertanyaan icebreaker berganti.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {soundEnabled && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => playChime('test')}
                      style={{ fontSize: '12px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      title="Tes efek suara sekarang"
                    >
                      <Volume2 size={14} />
                      <span>Tes Bunyi</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={`settings-switch-btn ${soundEnabled ? 'active' : ''}`}
                    onClick={handleToggleSound}
                  >
                    <span className="settings-switch-slider"></span>
                  </button>
                </div>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-title">Notifikasi Realtime Board</div>
                  <div className="settings-toggle-desc">
                    Menampilkan toast saat anggota tim menambahkan kartu atau voting baru secara realtime.
                  </div>
                </div>
                <button
                  type="button"
                  className={`settings-switch-btn ${pusherAlerts ? 'active' : ''}`}
                  onClick={handleTogglePusherAlerts}
                >
                  <span className="settings-switch-slider"></span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
