import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Plus, 
  Search, 
  UserPlus, 
  Settings, 
  Info,
  Layers,
  Sparkles,
  Lightbulb,
  Pencil,
  Compass,
  Star,
  Scale
} from 'lucide-react';
import RocketIllustration from '../common/RocketIllustration';

// Template Definitions (6 complete templates matching catalog)
const RETRO_TEMPLATES = [
  {
    id: 'start-stop-continue',
    name: 'Start / Stop / Continue',
    desc: 'Fokus pada hal yang dimulai, dihentikan, dilanjutkan, dan rencana aksi',
    badge: 'Populer',
    badgeType: 'popular',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    columns: ['Start', 'Stop', 'Continue', 'Action Items'],
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  {
    id: 'mad-sad-glad',
    name: 'Mad Sad Glad',
    desc: 'Ekspresikan perasaan tim terhadap sesi atau sprint yang dilakukan',
    badge: null,
    badgeType: null,
    iconBg: '#ffe4e6',
    iconColor: '#f43f5e',
    columns: ['Mad', 'Sad', 'Glad'],
    color: '#ef4444',
    bg: '#fef2f2',
  },
  {
    id: '4ls',
    name: '4Ls Retrospective',
    desc: 'Refleksi mendalam: apa yang disukai, dipelajari, kurang, dan diharapkan',
    badge: null,
    badgeType: null,
    iconBg: '#e0f2fe',
    iconColor: '#0284c7',
    columns: ['Liked', 'Learned', 'Lacked', 'Longed for'],
    color: '#0284c7',
    bg: '#f0f9ff',
  },
  {
    id: 'went-well-wrong',
    name: 'Went Well / Went Wrong',
    desc: 'Evaluasi apa yang berjalan baik, jadi kendala, dan tindak lanjutnya',
    badge: 'Baru',
    badgeType: 'new',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    columns: ['What Went Well', 'What Went Wrong', 'Action Items'],
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    id: 'sailboat',
    name: 'Sailboat Retrospective',
    desc: 'Metafora kapal layar: angin pendorong, jangkar beban, karang bahaya, dan pulau tujuan',
    badge: null,
    badgeType: null,
    iconBg: '#e0f2fe',
    iconColor: '#0284c7',
    columns: ['Wind (Angin)', 'Anchor (Jangkar)', 'Rocks (Karang)', 'Island (Pulau)'],
    color: '#0284c7',
    bg: '#f0f9ff',
  },
  {
    id: 'starfish',
    name: 'Starfish Retrospective',
    desc: 'Optimasi porsi kebiasaan tim: Keep Doing, Less Of, More Of, Stop Doing, Start Doing',
    badge: null,
    badgeType: null,
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    columns: ['Keep Doing', 'Less Of', 'More Of', 'Stop Doing', 'Start Doing'],
    color: '#d97706',
    bg: '#fffbeb',
  },
];

// Helper: render icon for each template
function TemplateIcon({ id, iconBg, iconColor }) {
  if (id === 'start-stop-continue') {
    return (
      <div className="retro-wizard-template-icon-circle" style={{ backgroundColor: iconBg }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 20h10" />
          <path d="M10 20c0-4 1.5-7 5-8" />
          <path d="M15 12c-4 0-7-2.5-7-6a6 6 0 0 1 6 6Z" />
          <path d="M11 15c2-1 3-3 3-5" />
        </svg>
      </div>
    );
  }

  if (id === 'mad-sad-glad') {
    return (
      <div className="retro-wizard-template-icon-circle" style={{ backgroundColor: iconBg }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13" cy="7" r="4.5" />
          <path d="M11.5 6h.01M14.5 6h.01" strokeWidth="2" />
          <path d="M11.5 8.5c.5-.5 2.5-.5 3 0" />
          <circle cx="7" cy="18" r="4.5" />
          <path d="M5.5 16.5l1 .5M8.5 17l-1-.5" />
          <path d="M6 19.5h2" />
          <circle cx="19" cy="18" r="4.5" />
          <path d="M17.5 17h.01M20.5 17h.01" strokeWidth="2" />
          <path d="M17.5 19c.5.8 2.5.8 3 0" />
        </svg>
      </div>
    );
  }

  if (id === '4ls') {
    return (
      <div className="retro-wizard-template-icon-circle" style={{ backgroundColor: iconBg }}>
        <Layers size={22} color={iconColor} />
      </div>
    );
  }

  if (id === 'sailboat') {
    return (
      <div className="retro-wizard-template-icon-circle" style={{ backgroundColor: iconBg }}>
        <Compass size={22} color={iconColor} />
      </div>
    );
  }

  if (id === 'starfish') {
    return (
      <div className="retro-wizard-template-icon-circle" style={{ backgroundColor: iconBg }}>
        <Star size={22} color={iconColor} />
      </div>
    );
  }

  // Went Well / Went Wrong (Scale)
  return (
    <div className="retro-wizard-template-icon-circle" style={{ backgroundColor: iconBg }}>
      <Scale size={22} color={iconColor} />
    </div>
  );
}

export default function BuatRetroWizardModal({
  isOpen,
  onClose,
  onCreateBoard,
  onOpenBoard,
  workspace,
  currentUser,
}) {
  // Wizard steps: 1: Template, 2: Invite, 3: Mulai
  const [step, setStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState('start-stop-continue');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [customInvitedMembers, setCustomInvitedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Available Workspace Members
  const allWorkspaceMembers = useMemo(() => {
    let list = [];
    const rawMembers = workspace?.members || [];
    if (rawMembers.length > 0) {
      list = rawMembers.map((m, idx) => ({
        id: m.id || m.userId || `mem-${idx}`,
        name: m.name || m.user?.name || m.fullName || 'Member',
        team: workspace?.name || 'Mobile Team',
        avatarUrl: m.avatarUrl || m.user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name || m.user?.name || 'Member')}`,
      }));
    } else if (currentUser) {
      list = [
        {
          id: currentUser.id || 'current-user',
          name: currentUser.name || currentUser.fullName || 'Anda',
          team: workspace?.name || 'Mobile Team',
          avatarUrl: currentUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name || 'Anda')}`,
        }
      ];
    }
    return [...list, ...customInvitedMembers];
  }, [workspace, currentUser, customInvitedMembers]);

  const defaultTitle = `Sprint ${(workspace?.boards?.length || 0) + 1} Retrospective`;
  const [boardTitleInput, setBoardTitleInput] = useState(defaultTitle);
  const prevIsOpenRef = useRef(false);

  // Reset state ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setStep(1);
      setSelectedTemplateId('start-stop-continue');
      setSearchMemberQuery('');
      setCustomInvitedMembers([]);
      setIsLoading(false);
      setLoadingProgress(0);
      const nextSprint = (workspace?.boards?.length || 0) + 1;
      setBoardTitleInput(`Sprint ${nextSprint} Retrospective`);
      // Preselect current user / first members
      const initialIds = (workspace?.members || []).slice(0, 4).map(m => m.id || m.userId);
      setSelectedMemberIds(initialIds.length > 0 ? initialIds : (currentUser?.id ? [currentUser.id] : []));
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, workspace?.boards?.length, workspace?.members, currentUser?.id]);

  // Loading progress effect when Mulai Retro is clicked (Super fast: ~0.3 detik)
  useEffect(() => {
    let timer;
    let finishTimer;
    if (isLoading) {
      setLoadingProgress(35);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 95;
          }
          return prev + 30;
        });
      }, 50);

      timer = setTimeout(() => {
        setLoadingProgress(100);
        finishTimer = setTimeout(() => {
          handleExecuteCreateBoard();
        }, 100);
      }, 200);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
        clearTimeout(finishTimer);
      };
    }
  }, [isLoading]);

  if (!isOpen) return null;

  const currentTemplate = RETRO_TEMPLATES.find(t => t.id === selectedTemplateId) || RETRO_TEMPLATES[0];

  // Filtered members for step 2
  const selectedMembers = allWorkspaceMembers.filter(m => selectedMemberIds.includes(m.id));
  const filteredWorkspaceMembers = allWorkspaceMembers.filter(m => 
    m.name.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
    m.team.toLowerCase().includes(searchMemberQuery.toLowerCase())
  );

  const handleToggleMember = (id) => {
    setSelectedMemberIds((prev) => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleRemoveMember = (id) => {
    setSelectedMemberIds((prev) => prev.filter(mId => mId !== id));
  };

  // Final Action: Create Board
  const handleExecuteCreateBoard = async () => {
    const nextSprintNum = (workspace?.boards?.length || 0) + 1;
    const finalTitle = boardTitleInput.trim() || `Sprint ${nextSprintNum} Retrospective`;
    const newBoard = {
      id: `board_${Date.now()}`,
      title: finalTitle,
      name: finalTitle,
      description: `Evaluasi sprint dan refleksi capaian kinerja tim ${workspace?.name || 'Mobile Team'}.`,
      workspaceId: workspace?.id,
      membersCount: selectedMembers.length || 8,
      status: 'active',
      createdAt: new Date().toISOString(),
      dateText: `Dibuat ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      theme: { bg: currentTemplate.bg, color: currentTemplate.color },
      color: currentTemplate.color,
      template: currentTemplate.id,
      columns: currentTemplate.columns,
    };

    // 1. Immediately close modal & dismiss loading screen
    setIsLoading(false);
    onClose();

    // 2. Open board view immediately for a fast, responsive transition
    if (onOpenBoard) {
      onOpenBoard(newBoard);
    }

    // 3. Sync to workspace state and backend
    if (onCreateBoard) {
      try {
        const res = await onCreateBoard(newBoard);
        if (res && res.id && res.id !== newBoard.id) {
          const syncedBoard = { ...newBoard, ...res, id: res.id, dbId: res.id };
          if (onOpenBoard) {
            onOpenBoard(syncedBoard);
          }
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi board baru:', err);
      }
    }
  };

  return (
    <div className="retro-wizard-overlay" onClick={onClose}>
      {/* ═══ LOADING MODAL (SCREEN 4) ═══ */}
      {isLoading ? (
        <div 
          className="retro-wizard-loading-card" 
          onClick={(e) => e.stopPropagation()}
        >
          <RocketIllustration size={150} />
          <h2 className="retro-wizard-loading-title">Menyiapkan Retro...</h2>
          <p className="retro-wizard-loading-subtitle">Membuka board kamu</p>

          <div className="retro-wizard-progress-bar-bg">
            <div 
              className="retro-wizard-progress-bar-fill" 
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      ) : (
        /* ═══ 3-STEP WIZARD MODAL ═══ */
        <div 
          className="retro-wizard-modal-box"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="retro-wizard-header">
            <h2 className="retro-wizard-title">Buat Retrospective</h2>
            <button 
              type="button" 
              className="retro-wizard-close-btn" 
              onClick={onClose} 
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper Navigation */}
          <div className="retro-wizard-stepper">
            {/* Step 1 */}
            <div className={`stepper-step-item ${step >= 1 ? 'active' : ''}`}>
              <div className={`stepper-circle ${step >= 1 ? 'filled' : ''}`}>
                1
              </div>
              <span className={`stepper-label ${step >= 1 ? 'active' : ''}`}>
                Template
              </span>
            </div>

            {/* Line 1 -> 2 */}
            <div className={`stepper-line ${step >= 2 ? 'filled' : ''}`} />

            {/* Step 2 */}
            <div className={`stepper-step-item ${step >= 2 ? 'active' : ''}`}>
              <div className={`stepper-circle ${step >= 2 ? 'filled' : ''}`}>
                2
              </div>
              <span className={`stepper-label ${step >= 2 ? 'active' : ''}`}>
                Invite
              </span>
            </div>

            {/* Line 2 -> 3 */}
            <div className={`stepper-line ${step >= 3 ? 'filled' : ''}`} />

            {/* Step 3 */}
            <div className={`stepper-step-item ${step >= 3 ? 'active' : ''}`}>
              <div className={`stepper-circle ${step >= 3 ? 'filled' : ''}`}>
                3
              </div>
              <span className={`stepper-label ${step >= 3 ? 'active' : ''}`}>
                Mulai
              </span>
            </div>
          </div>

          {/* ════ STEP 1: PILIH TEMPLATE ════ */}
          {step === 1 && (
            <div className="retro-wizard-step-body">
              <div className="retro-wizard-step-intro">
                <h3 className="retro-wizard-section-title">Pilih template</h3>
                <p className="retro-wizard-section-desc">
                  Pilih format retro yang paling sesuai untuk tim kamu.
                </p>
              </div>

              {/* Template Cards Grid (4 cards) */}
              <div className="retro-wizard-templates-grid">
                {RETRO_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <div 
                      key={tmpl.id}
                      className={`retro-wizard-template-card ${isSelected ? 'selected' : ''} ${tmpl.badgeType === 'new' ? 'has-new-badge' : ''}`}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                    >
                      {/* Badge if Popular or New */}
                      {tmpl.badge && (
                        <div className={`retro-wizard-card-badge badge-${tmpl.badgeType}`}>
                          {tmpl.badge}
                        </div>
                      )}

                      {/* Icon */}
                      <TemplateIcon 
                        id={tmpl.id} 
                        iconBg={tmpl.iconBg} 
                        iconColor={tmpl.iconColor} 
                      />

                      {/* Title & Desc */}
                      <h4 className="retro-wizard-template-name">{tmpl.name}</h4>
                      <p className="retro-wizard-template-desc">{tmpl.desc}</p>

                      {/* Select / Selected Button */}
                      <button 
                        type="button" 
                        className={`retro-wizard-select-btn ${isSelected ? 'is-selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplateId(tmpl.id);
                        }}
                      >
                        {isSelected && <Check size={14} className="retro-check-icon" />}
                        <span>{isSelected ? 'Dipilih' : 'Pilih'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="retro-wizard-footer right-only">
                <button
                  type="button"
                  className="retro-wizard-btn-primary"
                  onClick={() => setStep(2)}
                >
                  <span>Lanjut</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 2: INVITE ANGGOTA TIM ════ */}
          {step === 2 && (
            <div className="retro-wizard-step-body">
              <div className="retro-wizard-step-intro">
                <h3 className="retro-wizard-section-title">Invite anggota tim</h3>
                <p className="retro-wizard-section-desc">
                  Tambahkan anggota yang akan mengikuti sesi retro
                </p>
              </div>

              {/* 2-Columns Layout */}
              <div className="retro-wizard-invite-layout">
                {/* Left Column: Search & Selected */}
                <div className="retro-wizard-invite-left">
                  <div className="retro-wizard-search-box">
                    <Search size={16} className="search-icon" />
                    <input 
                      type="text"
                      className="search-input"
                      placeholder="Cari anggota atau masukkan nama/email..."
                      value={searchMemberQuery}
                      onChange={(e) => setSearchMemberQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchMemberQuery.trim()) {
                          e.preventDefault();
                          const query = searchMemberQuery.trim();
                          const exists = allWorkspaceMembers.find(m => m.name.toLowerCase() === query.toLowerCase());
                          if (exists) {
                            if (!selectedMemberIds.includes(exists.id)) {
                              setSelectedMemberIds(prev => [...prev, exists.id]);
                            }
                          } else {
                            const newM = {
                              id: `custom-${Date.now()}`,
                              name: query,
                              team: workspace?.name || 'Tim',
                              avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(query)}`,
                            };
                            setCustomInvitedMembers(prev => [...prev, newM]);
                            setSelectedMemberIds(prev => [...prev, newM.id]);
                          }
                          setSearchMemberQuery('');
                        }
                      }}
                    />
                  </div>

                  {searchMemberQuery.trim() && !allWorkspaceMembers.some(m => m.name.toLowerCase() === searchMemberQuery.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => {
                        const query = searchMemberQuery.trim();
                        const newM = {
                          id: `custom-${Date.now()}`,
                          name: query,
                          team: workspace?.name || 'Tim',
                          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(query)}`,
                        };
                        setCustomInvitedMembers(prev => [...prev, newM]);
                        setSelectedMemberIds(prev => [...prev, newM.id]);
                        setSearchMemberQuery('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 10px',
                        backgroundColor: '#f3f0ff',
                        border: '1px dashed #7c3aed',
                        borderRadius: '8px',
                        color: '#7c3aed',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        margin: '6px 0 10px 0',
                        width: '100%',
                        textAlign: 'left',
                      }}
                    >
                      <Plus size={14} />
                      <span>Tambahkan "{searchMemberQuery.trim()}" ke sesi ini</span>
                    </button>
                  )}

                  <h4 className="retro-wizard-group-title">
                    Anggota dipilih ({selectedMembers.length})
                  </h4>

                  <div className="retro-wizard-selected-list">
                    {selectedMembers.length === 0 ? (
                      <div className="retro-wizard-empty-members">
                        Belum ada anggota dipilih. Silakan pilih dari daftar di sebelah kanan.
                      </div>
                    ) : (
                      selectedMembers.map((member) => (
                        <div key={member.id} className="retro-wizard-member-item">
                          <img 
                            src={member.avatarUrl} 
                            alt={member.name} 
                            className="member-avatar" 
                          />
                          <div className="member-info">
                            <span className="member-name">{member.name}</span>
                            <span className="member-team">{member.team}</span>
                          </div>
                          <button 
                            type="button" 
                            className="member-remove-btn"
                            onClick={() => handleRemoveMember(member.id)}
                            title="Hapus anggota"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="retro-wizard-info-tip">
                    <div className="info-icon-badge">
                      <Info size={14} />
                    </div>
                    <span>Kamu juga bisa mengundang anggota nanti dari board</span>
                  </div>
                </div>

                {/* Right Column: Anggota Workspace */}
                <div className="retro-wizard-invite-right">
                  <h4 className="retro-wizard-group-title right-title">
                    Anggota workspace
                  </h4>

                  <div className="retro-wizard-workspace-members-list">
                    {filteredWorkspaceMembers.map((member) => {
                      const isSelected = selectedMemberIds.includes(member.id);
                      return (
                        <div 
                          key={member.id} 
                          className={`retro-wizard-ws-member-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleMember(member.id)}
                        >
                          <img 
                            src={member.avatarUrl} 
                            alt={member.name} 
                            className="member-avatar" 
                          />
                          <div className="member-info">
                            <span className="member-name">{member.name}</span>
                            <span className="member-team">{member.team}</span>
                          </div>
                          <button 
                            type="button" 
                            className={`ws-member-action-btn ${isSelected ? 'btn-remove' : 'btn-add'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMember(member.id);
                            }}
                            title={isSelected ? 'Hapus' : 'Tambah'}
                          >
                            {isSelected ? <X size={15} /> : <Plus size={15} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="retro-wizard-footer space-between">
                <button
                  type="button"
                  className="retro-wizard-btn-skip"
                  onClick={() => setStep(3)}
                >
                  Lewati untuk sekarang
                </button>

                <button
                  type="button"
                  className="retro-wizard-btn-primary"
                  onClick={() => setStep(3)}
                >
                  <span>Lanjut</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 3: MULAI RETRO ════ */}
          {step === 3 && (
            <div className="retro-wizard-step-body center-step">
              <div className="retro-wizard-mulai-center">
                {/* Rocket Illustration */}
                <RocketIllustration size={75} />

                <h3 className="retro-wizard-mulai-title">Siap memulai retro?</h3>
                <p className="retro-wizard-mulai-subtitle">
                  Pastikan detail berikut sudah sesuai sebelum kamu memulai
                </p>

                {/* Summary Rows */}
                <div className="retro-wizard-summary-card">
                  {/* Row 0: Nama Board (Dapat diubah) */}
                  <div className="retro-wizard-summary-row" style={{ padding: '6px 14px' }}>
                    <div className="summary-icon-box" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                      <Pencil size={15} />
                    </div>
                    <span className="summary-label" style={{ width: '85px' }}>Nama Board</span>
                    <input
                      type="text"
                      value={boardTitleInput}
                      onChange={(e) => setBoardTitleInput(e.target.value)}
                      placeholder="Contoh: Sprint 16 Retrospective"
                      style={{
                        flex: 1,
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0f172a',
                        background: '#ffffff',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Row 1: Template */}
                  <div className="retro-wizard-summary-row">
                    <div className="summary-icon-box template-icon">
                      <TemplateIcon 
                        id={currentTemplate.id} 
                        iconBg="#e0f2fe" 
                        iconColor="#0284c7" 
                      />
                    </div>
                    <span className="summary-label">Template</span>
                    <span className="summary-value">{currentTemplate.name}</span>
                  </div>

                  {/* Row 2: Anggota */}
                  <div className="retro-wizard-summary-row">
                    <div className="summary-icon-box member-icon">
                      <UserPlus size={18} color="#7c3aed" />
                    </div>
                    <span className="summary-label">Anggota</span>
                    <span className="summary-value">{selectedMembers.length || 8} Anggota</span>
                  </div>

                  {/* Row 3: Pengaturan */}
                  <div className="retro-wizard-summary-row">
                    <div className="summary-icon-box settings-icon">
                      <Settings size={18} color="#7c3aed" />
                    </div>
                    <span className="summary-label">Pengaturan</span>
                    <span className="summary-value">Anonymous + Multi Timer + Icebreaker + Reveal Card</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="retro-wizard-footer space-between">
                <button
                  type="button"
                  className="retro-wizard-btn-outline"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft size={16} />
                  <span>Kembali</span>
                </button>

                <button
                  type="button"
                  className="retro-wizard-btn-primary"
                  onClick={() => setIsLoading(true)}
                >
                  <span>Mulai Retro</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
