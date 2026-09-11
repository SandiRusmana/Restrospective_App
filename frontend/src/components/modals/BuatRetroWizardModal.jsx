import React, { useState, useEffect, useMemo } from 'react';
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
  Lightbulb
} from 'lucide-react';
import RocketIllustration from '../common/RocketIllustration';

// Template Definitions exactly as shown in Screenshots
const RETRO_TEMPLATES = [
  {
    id: 'start-stop-continue',
    name: 'Start / Stop / Continue',
    desc: 'Fokus pada hal yang dimulai, dihentikan, dan dilanjutkan',
    badge: 'Populer',
    badgeType: 'popular',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    columns: ['Start', 'Stop', 'Continue'],
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
    name: '4Ls',
    desc: 'Refleksi mendalam dengan mencari tahu apa yang disukai, dipelajari, kurang, dan diharapkan',
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
    desc: 'Evaluasi apa yang berjalan baik, jadi masalah, dan rencana perbaikannya',
    badge: 'Baru',
    badgeType: 'new',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    columns: ['What Went Well', 'What Went Wrong', 'Action Items'],
    color: '#d97706',
    bg: '#fffbeb',
  },
];

// Helper: render icon for each template
function TemplateIcon({ id, iconBg, iconColor }) {
  if (id === 'start-stop-continue') {
    return (
      <div className="retro-wizard-template-icon-circle" style={{ backgroundColor: iconBg }}>
        {/* Plant / Sprout Icon */}
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
        {/* 3 Faces Icon */}
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Top Face (Sad / Worried) */}
          <circle cx="13" cy="7" r="4.5" />
          <path d="M11.5 6h.01M14.5 6h.01" strokeWidth="2" />
          <path d="M11.5 8.5c.5-.5 2.5-.5 3 0" />
          {/* Bottom Left Face (Mad / Angry) */}
          <circle cx="7" cy="18" r="4.5" />
          <path d="M5.5 16.5l1 .5M8.5 17l-1-.5" />
          <path d="M6 19.5h2" />
          {/* Bottom Right Face (Glad / Happy) */}
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
        {/* 4 Rounded Squares Grid */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7.5" height="7.5" rx="2.5" fill={iconColor} />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.5" fill={iconColor} />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.5" fill={iconColor} />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.5" fill={iconColor} />
        </svg>
      </div>
    );
  }

  // Went Well / Went Wrong (Lightbulb)
  return (
    <div className="retro-wizard-template-icon-circle" style={{ backgroundColor: iconBg }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2v1" />
        <path d="M12 7a5 5 0 0 0-3 9h6a5 5 0 0 0-3-9Z" />
        <path d="M4.9 4.9l.7.7" />
        <path d="M19.1 4.9l-.7.7" />
        <path d="M2 12h1" />
        <path d="M21 12h1" />
      </svg>
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
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Available Workspace Members
  const allWorkspaceMembers = useMemo(() => {
    const rawMembers = workspace?.members || [];
    if (rawMembers.length > 0) {
      return rawMembers.map((m, idx) => ({
        id: m.id || `mem-${idx}`,
        name: m.name || m.fullName || 'Member',
        team: workspace?.name || 'Mobile Team',
        avatarUrl: m.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
      }));
    }

    // Default mock list matching the Afrizal screenshot
    return [
      {
        id: 'mem-1',
        name: currentUser?.name || 'Afrizal',
        team: workspace?.name || 'Mobile Team',
        avatarUrl: currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      },
      {
        id: 'mem-2',
        name: 'Afrizal',
        team: workspace?.name || 'Mobile Team',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      },
      {
        id: 'mem-3',
        name: 'Afrizal',
        team: workspace?.name || 'Mobile Team',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      },
      {
        id: 'mem-4',
        name: 'Afrizal',
        team: workspace?.name || 'Mobile Team',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
      },
      {
        id: 'mem-5',
        name: 'Afrizal',
        team: workspace?.name || 'Mobile Team',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
      }
    ];
  }, [workspace, currentUser]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedTemplateId('start-stop-continue');
      setSearchMemberQuery('');
      setIsLoading(false);
      setLoadingProgress(0);
      // Preselect first 4 members (matching the screenshot)
      setSelectedMemberIds(allWorkspaceMembers.slice(0, 4).map(m => m.id));
    }
  }, [isOpen, allWorkspaceMembers]);

  // Loading progress effect when Mulai Retro is clicked
  useEffect(() => {
    let timer;
    if (isLoading) {
      setLoadingProgress(15);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 92) {
            clearInterval(interval);
            return 95;
          }
          return prev + 18;
        });
      }, 180);

      timer = setTimeout(() => {
        setLoadingProgress(100);
        setTimeout(() => {
          handleExecuteCreateBoard();
        }, 300);
      }, 1200);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
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
  const handleExecuteCreateBoard = () => {
    const nextSprintNum = (workspace?.boards?.length || 0) + 16;
    const newBoard = {
      id: `board_${Date.now()}`,
      title: `Sprint ${nextSprintNum} Retrospective`,
      description: `Evaluasi sprint dan refleksi capaian kinerja tim ${workspace?.name || 'Mobile Team'}.`,
      workspaceId: workspace?.id,
      membersCount: selectedMembers.length || 8,
      status: 'active',
      createdAt: new Date().toISOString(),
      dateText: `Dibuat ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      daysLeft: '2 hari lagi',
      theme: { bg: currentTemplate.bg, color: currentTemplate.color },
      color: currentTemplate.color,
      template: currentTemplate.id,
      columns: currentTemplate.columns,
    };

    if (onCreateBoard) {
      onCreateBoard(newBoard);
    }
    if (onOpenBoard) {
      onOpenBoard(newBoard);
    }
    setIsLoading(false);
    onClose();
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
                      placeholder="Cari anggota atau masukkan email..."
                      value={searchMemberQuery}
                      onChange={(e) => setSearchMemberQuery(e.target.value)}
                    />
                  </div>

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
                <RocketIllustration size={135} />

                <h3 className="retro-wizard-mulai-title">Siap memulai retro?</h3>
                <p className="retro-wizard-mulai-subtitle">
                  Pastikan detail berikut sudah sesuai sebelum kamu memulai
                </p>

                {/* Summary Rows */}
                <div className="retro-wizard-summary-card">
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
