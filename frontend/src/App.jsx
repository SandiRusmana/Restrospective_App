import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LayoutGrid, List, Search, ArrowLeft, Loader2, ShieldAlert, AlertCircle, SearchX, Compass } from 'lucide-react';
import { api } from './services/api';

// Helper: Ekstraksi UUID board dari format /board/:uuid
const getBoardIdFromPath = (path) => {
  const match = (path || '').match(/^\/board\/([0-9a-fA-F-]{36})/);
  return match ? match[1] : null;
};

// Helper: Ekstraksi token invite dari URL (?invite=... atau /invite/:token)
const getInviteTokenFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  const fromQuery = urlParams.get('invite');
  if (fromQuery) return fromQuery;
  const match = (window.location.pathname || '').match(/^\/invite\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

// Sidebar Navigation Items
const sidebarNavItems = [
  { id: "workspace", label: "Workspace", icon: "LayoutGrid", active: true },
  { id: "my-boards", label: "My Boards", icon: "Kanban", active: false },
  { id: "activity", label: "Activity", icon: "Clock", active: false },
  { id: "templates", label: "Templates", icon: "FileText", active: false },
  { id: "settings", label: "Settings", icon: "Settings", active: false }
];

// Landing Page
import LandingPage from './landingpage/LandingPage';

// Auth Pages
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';

// Layout & Workspace Components
import Sidebar from './components/layout/Sidebar';
import WorkspaceHeader from './components/workspace/WorkspaceHeader';
import WorkspaceCard from './components/workspace/WorkspaceCard';
import CreateWorkspaceCard from './components/workspace/CreateWorkspaceCard';
import WorkspaceSwitcher from './components/workspace/WorkspaceSwitcher';
import ActiveWorkspaceCard from './components/workspace/ActiveWorkspaceCard';
import MembersListCard from './components/workspace/MembersListCard';
import RecentBoardsCard from './components/workspace/RecentBoardsCard';
import WorkspaceBoardsView from './components/workspace/WorkspaceBoardsView';
import MyBoardsView from './components/workspace/MyBoardsView';
import { getUserAvatar } from './utils/avatar';

// Sidebar Feature Views
import ActivityView from './components/activity/ActivityView';
import TemplatesView from './components/templates/TemplatesView';
import SettingsView from './components/settings/SettingsView';

// Board Detail & Modals
import RetroBoardDetail from './components/board/RetroBoardDetail';
import CreateWorkspaceModal from './components/modals/CreateWorkspaceModal';
import CreateBoardModal from './components/modals/CreateBoardModal';
import BuatRetroWizardModal from './components/modals/BuatRetroWizardModal';
import InviteMemberModal from './components/modals/InviteMemberModal';
import JoinWorkspaceModal from './components/modals/JoinWorkspaceModal';
import Toast from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import { getConsistentWorkspaceColor, saveWorkspaceColor } from './utils/workspaceColor';

export default function App() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  // Page Routing State: 'landing' | 'login' | 'register' | 'dashboard'
  const [currentPage, setCurrentPage] = useState(token ? 'dashboard' : 'landing');
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(Boolean(token));

  // Main Dashboard View State: 'workspace-detail' | 'all-workspaces' | 'board-detail'
  const [dashboardView, setDashboardView] = useState('workspace-detail');
  const [activeBoard, setActiveBoard] = useState(null);

  // Dashboard States
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [activeNav, setActiveNav] = useState('workspace');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Dark Mode State: Default saat pertama kali masuk adalah LIGHT MODE (false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const explicit = localStorage.getItem('retro_theme_explicit');
      const saved = localStorage.getItem('retro_theme');
      // Hanya aktifkan dark mode jika user secara eksplisit pernah mengubahnya ke dark
      if (explicit === 'true' && saved === 'dark') {
        return true;
      }
      return false; // Default selalu Light Mode saat pertama kali masuk
    } catch {
      return false;
    }
  });

  // Collapsible Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('retro_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark-theme');
        document.body.classList.remove('dark-theme');
        localStorage.setItem('retro_theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('retro_theme_explicit', 'true');
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);
  
  // Modals & Toast State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [selectedTemplateForCreate, setSelectedTemplateForCreate] = useState(null);
  const [isWizardModalOpen, setIsWizardModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Workspace Invite State
  const [inviteToken, setInviteToken] = useState(() => getInviteTokenFromUrl());
  const [inviteData, setInviteData] = useState(null);
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isJoiningWorkspace, setIsJoiningWorkspace] = useState(false);

  // Direct Board URL & Authorization Error State
  const [boardAccessError, setBoardAccessError] = useState(null);
  const [isBoardDirectLoading, setIsBoardDirectLoading] = useState(false);

  // Trigger Toast Notification
  const showToast = useCallback((message) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);
  }, []);

  // Handler: Tutup Modal Undangan & Bersihkan URL/Storage
  const handleCloseJoinModal = useCallback(() => {
    setIsJoinModalOpen(false);
    setInviteError(null);
    sessionStorage.removeItem('pending_invite_token');
    sessionStorage.removeItem('pending_invite_workspace_name');
    setInviteToken(null);
    setInviteData(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('invite');
    window.history.replaceState({}, document.title, url.pathname + (url.search || ''));
  }, []);

  // Handler: Validasi & Ambil Detail Info Undangan
  const validateAndLoadInvite = useCallback(async (token) => {
    if (!token) return;
    setInviteToken(token);
    setIsInviteLoading(true);
    setInviteError(null);
    setIsJoinModalOpen(true);
    try {
      sessionStorage.setItem('pending_invite_token', token);
      const data = await api.getInviteInfo(token);
      setInviteData(data);
      if (data?.workspace?.name) {
        sessionStorage.setItem('pending_invite_workspace_name', data.workspace.name);
      }
    } catch (err) {
      console.error('Gagal memvalidasi token invite:', err);
      setInviteError(err.message || 'Link invite tidak valid atau sudah kedaluwarsa.');
      sessionStorage.removeItem('pending_invite_token');
      sessionStorage.removeItem('pending_invite_workspace_name');
    } finally {
      setIsInviteLoading(false);
    }
  }, []);

  // Helper: Auto-Join Otomatis Setelah Login / Register / Demo
  const processPendingInviteAfterAuth = useCallback(async (currentUserObj) => {
    const pendingToken = sessionStorage.getItem('pending_invite_token');
    if (!pendingToken) return null;

    try {
      const res = await api.joinWorkspace(pendingToken);
      sessionStorage.removeItem('pending_invite_token');
      sessionStorage.removeItem('pending_invite_workspace_name');
      setInviteToken(null);
      setInviteData(null);
      setIsJoinModalOpen(false);

      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState({}, document.title, url.pathname + (url.search || ''));

      showToast(res.message || 'Berhasil bergabung ke workspace undangan!');
      return res.workspace?.id || null;
    } catch (err) {
      console.warn('Auto-join invite gagal:', err);
      sessionStorage.removeItem('pending_invite_token');
      sessionStorage.removeItem('pending_invite_workspace_name');
      return null;
    }
  }, [showToast]);

  // Fetch Workspaces from Backend API with real members and real boards
  const fetchWorkspaces = useCallback(async (currentUserObj) => {
    try {
      const data = await api.getWorkspaces();
      if (data && Array.isArray(data) && data.length > 0) {
        const fullWorkspaces = await Promise.all(
          data.map(async (ws, idx) => {
            let boards = [];
            try {
              const res = await api.getBoards(ws.id);
              if (Array.isArray(res)) {
                boards = res.map((b) => ({
                  id: b.id,
                  title: b.name || b.title,
                  name: b.name || b.title,
                  template: b.template,
                  isAnonymous: b.isAnonymous,
                  voteLimit: b.voteLimit,
                  cardsCount: b.cardsCount || (b._count ? b._count.cards : 0) || 0,
                  createdAt: b.createdAt,
                  theme: { bg: '#f3f0ff', color: '#7c3aed' },
                }));
              }
            } catch {
              boards = [];
            }

            const initial = (ws.name || 'W').substring(0, 1).toUpperCase();
            
            // Real members formatting from backend
            let members = [];
            if (ws.members && Array.isArray(ws.members) && ws.members.length > 0) {
              members = ws.members.map((m) => {
                const u = m.user || m;
                const uEmail = u.email || '';
                const uName = u.name || (uEmail ? uEmail.split('@')[0] : 'Anggota');
                const isMe = Boolean(currentUserObj && (u.id === currentUserObj.id || m.userId === currentUserObj.id || (uEmail && uEmail === currentUserObj.email)));
                const memberAvatar = isMe
                  ? (currentUserObj.avatarUrl || getUserAvatar(u, uName))
                  : getUserAvatar(u, uName);
                return {
                  id: m.userId || m.id || u.id,
                  userId: m.userId || u.id,
                  name: isMe ? `${uName} (Anda)` : uName,
                  role: m.role || (m.userId === ws.ownerId || u.id === ws.ownerId ? 'Owner' : 'Member'),
                  email: uEmail,
                  avatar: memberAvatar,
                  avatarUrl: memberAvatar,
                  isOnline: true,
                };
              });
            }

            // If members array empty from API, default to current user as Owner
            if (members.length === 0 && currentUserObj) {
              const defaultOwnerAvatar = getUserAvatar(currentUserObj);
              members = [{
                id: currentUserObj.id || 'owner',
                userId: currentUserObj.id || 'owner',
                name: currentUserObj.fullName || `${currentUserObj.name} (Anda)`,
                role: 'Owner',
                email: currentUserObj.email,
                avatar: defaultOwnerAvatar,
                avatarUrl: defaultOwnerAvatar,
                isOnline: true,
              }];
            }

            return {
              id: ws.id,
              name: ws.name,
              initial,
              color: getConsistentWorkspaceColor(ws),
              role: ws.ownerId === currentUserObj?.id ? 'Owner' : 'Owner',
              description: `Workspace untuk ${ws.name}`,
              longDescription: `Workspace untuk tim ${ws.name}. Semua retrospective dan diskusi tim dilakukan di sini`,
              memberCount: members.length,
              dateText: 'Dibuat baru saja',
              isRecent: true,
              members,
              boards,
            };
          })
        );
        
        setWorkspaces(fullWorkspaces);
        if (fullWorkspaces.length > 0) {
          setActiveWorkspaceId((prev) => {
            const exists = fullWorkspaces.some((w) => w.id === prev);
            return exists ? prev : fullWorkspaces[0].id;
          });
        }
      }
    } catch (err) {
      console.warn('Backend offline, menggunakan workspace demo:', err);
      const defaultUser = currentUserObj || {
        id: 'user_afrizal',
        name: 'Afrizal',
        fullName: 'Afrizal (Anda)',
        email: 'afrizal@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        isOnline: true
      };
      const fallbackWorkspaces = [
        {
          id: 'ws_mobile_team',
          name: 'Mobile Team',
          initial: 'M',
          color: '#5956e9',
          role: 'Owner',
          description: 'Workspace tim Mobile Development RetroNerve',
          longDescription: 'Workspace untuk tim Mobile Team. Semua retrospective dan diskusi tim dilakukan di sini',
          memberCount: 8,
          dateText: 'Dibuat 30 Jun 2026',
          isRecent: true,
          members: [
            { id: '1', name: 'Afrizal (Anda)', role: 'Owner', email: 'afrizal@gmail.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', isOnline: true },
            { id: '2', name: 'Budi Santoso', role: 'Member', email: 'budi@gmail.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', isOnline: true },
            { id: '3', name: 'Citra Lestari', role: 'Member', email: 'citra@gmail.com', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', isOnline: true },
          ],
          boards: [
            {
              id: 'board_sprint_16',
              title: 'Sprint 16 Retrospective',
              name: 'Sprint 16 Retrospective',
              template: 'start-stop-continue',
              isAnonymous: false,
              voteLimit: 5,
              cardsCount: 9,
              createdAt: '2026-06-30T10:00:00.000Z',
              theme: { bg: '#f3f0ff', color: '#7c3aed' },
            }
          ]
        },
        {
          id: 'ws_web_team',
          name: 'Web Team',
          initial: 'W',
          color: '#2563eb',
          role: 'Owner',
          description: 'Workspace tim Web Platform',
          longDescription: 'Workspace untuk tim Web Platform',
          memberCount: 5,
          dateText: 'Dibuat 15 Jul 2026',
          isRecent: true,
          members: [],
          boards: []
        },
        {
          id: 'ws_qa_squad',
          name: 'QA Squad',
          initial: 'Q',
          color: '#10b981',
          role: 'Owner',
          description: 'Quality Assurance squad board',
          longDescription: 'Quality Assurance squad board',
          memberCount: 4,
          dateText: 'Dibuat 20 Jul 2026',
          isRecent: true,
          members: [],
          boards: []
        }
      ];
      setWorkspaces(fallbackWorkspaces);
      setActiveWorkspaceId('ws_mobile_team');
    }
  }, []);

  // Handler: Load Board Directly by UUID (Mendukung URL /board/:uuid)
  const loadBoardDirectly = useCallback(async (boardId, queryReadOnly = false) => {
    setIsBoardDirectLoading(true);
    setBoardAccessError(null);
    try {
      const boardData = await api.getBoardById(boardId);
      if (boardData) {
        const formattedBoard = {
          ...boardData,
          title: boardData.name || boardData.title,
          name: boardData.name || boardData.title,
          workspaceId: boardData.workspaceId,
          userRole: boardData.userRole,
          isFacilitator: boardData.isFacilitator,
          initialReadOnly: queryReadOnly,
        };

        setActiveBoard(formattedBoard);
        if (boardData.workspaceId) {
          setActiveWorkspaceId(boardData.workspaceId);
        }
        setDashboardView('board-detail');
        setActiveNav('my-boards');

        // Pastikan URL di address bar sinkron
        const qs = queryReadOnly ? '?readOnly=true' : '';
        window.history.replaceState({}, '', `/board/${boardId}${qs}`);
      }
    } catch (err) {
      console.error('Gagal membuka board:', err);
      const status = err.status || (err.message?.includes('403') ? 403 : err.message?.includes('404') ? 404 : 500);
      let message = err.message || 'Gagal memuat board';
      if (status === 403) {
        message = 'Anda bukan anggota dari workspace pemilik board ini. Pihak luar tidak diperkenankan mengakses board retrospective ini.';
      } else if (status === 404 || status === 400) {
        message = 'Board tidak ditemukan atau format URL salah. Pastikan UUID board valid dan terdaftar di workspace Anda.';
      }
      setBoardAccessError({
        status,
        message,
      });
      setDashboardView('board-error');
    } finally {
      setIsBoardDirectLoading(false);
    }
  }, []);

  // Handler: Join Workspace oleh User yang Sedang Login
  const handleJoinWorkspace = useCallback(async () => {
    const tokenToUse = inviteToken || sessionStorage.getItem('pending_invite_token');
    if (!tokenToUse) return;
    try {
      setIsJoiningWorkspace(true);
      const res = await api.joinWorkspace(tokenToUse);
      showToast(res.message || 'Berhasil bergabung ke workspace!');

      sessionStorage.removeItem('pending_invite_token');
      sessionStorage.removeItem('pending_invite_workspace_name');
      setInviteToken(null);
      setInviteData(null);
      setIsJoinModalOpen(false);

      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState({}, document.title, url.pathname + (url.search || ''));

      if (user) {
        await fetchWorkspaces(user);
      }
      if (res.workspace?.id) {
        setActiveWorkspaceId(res.workspace.id);
        setDashboardView('workspace-detail');
        setActiveNav('workspace');
      }
    } catch (err) {
      showToast(err.message || 'Gagal bergabung ke workspace.');
    } finally {
      setIsJoiningWorkspace(false);
    }
  }, [inviteToken, showToast, user, fetchWorkspaces]);

  // Initial Auth Check on Mount (termasuk deteksi callback Google OAuth, Deep Link /board/:uuid, & Link Invite)
  useEffect(() => {
    async function checkAuth() {
      // 1. Cek apakah ada parameter invite di URL (?invite=... atau /invite/:token)
      const inviteFromUrl = getInviteTokenFromUrl();
      if (inviteFromUrl) {
        validateAndLoadInvite(inviteFromUrl);
      }

      // 2. Cek apakah ada redirect token dari Google OAuth di URL
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      const authError = urlParams.get('error');

      if (tokenFromUrl) {
        localStorage.setItem('access_token', tokenFromUrl);
        // Bersihkan parameter query dari address bar agar rapi
        window.history.replaceState({}, document.title, window.location.pathname.replace('/auth/callback', '') || '/');
      } else if (authError) {
        showToast('Login dengan Google gagal atau dibatalkan.');
        window.history.replaceState({}, document.title, window.location.pathname.replace('/auth/callback', '') || '/');
      }

      const savedToken = localStorage.getItem('access_token');
      const initialPath = window.location.pathname;
      const initialBoardUuid = getBoardIdFromPath(initialPath);
      const isInitialReadOnly = urlParams.get('readOnly') === 'true';

      if (savedToken) {
        setIsLoadingAuth(true);
        try {
          const userData = await api.getMe();
          const formattedUser = {
            id: userData.id,
            name: userData.name || userData.email.split('@')[0],
            fullName: userData.name ? `${userData.name} (Anda)` : `${userData.email} (Anda)`,
            email: userData.email,
            avatarUrl: getUserAvatar(userData),
            isOnline: true
          };
          setUser(formattedUser);
          setCurrentPage('dashboard');

          // Jika baru kembali dari Google OAuth dan membawa pending invite
          let joinedWsId = null;
          if (tokenFromUrl) {
            joinedWsId = await processPendingInviteAfterAuth(formattedUser);
          }

          await fetchWorkspaces(formattedUser);

          if (joinedWsId) {
            setActiveWorkspaceId(joinedWsId);
            setDashboardView('workspace-detail');
          }

          // Cek apakah ada redirect target setelah login dari sessionStorage atau URL langsung
          const redirectAfter = sessionStorage.getItem('redirect_after_login');
          const targetBoardUuid = redirectAfter ? getBoardIdFromPath(redirectAfter) : initialBoardUuid;
          const targetReadOnly = redirectAfter
            ? new URLSearchParams(redirectAfter.split('?')[1] || '').get('readOnly') === 'true'
            : isInitialReadOnly;

          if (redirectAfter) {
            sessionStorage.removeItem('redirect_after_login');
          }

          if (targetBoardUuid) {
            await loadBoardDirectly(targetBoardUuid, targetReadOnly);
          } else if (initialPath.startsWith('/board/')) {
            setBoardAccessError({
              status: 404,
              message: 'Format URL board tidak valid atau ID board tidak ditemukan. Pastikan URL board memiliki format UUID v4 yang sesuai.',
            });
            setDashboardView('board-error');
          }
        } catch {
          api.logout();
          setUser(null);
          setCurrentPage('login');
        } finally {
          setIsLoadingAuth(false);
        }
      } else {
        // Belum login tapi mengakses link /board/:uuid
        if (initialBoardUuid) {
          sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search);
          setCurrentPage('login');
        } else {
          // Tetap di landing page (default) jika belum login dan bukan link board
          setCurrentPage('landing');
        }
        setIsLoadingAuth(false);
      }
    }
    checkAuth();
  }, [fetchWorkspaces, loadBoardDirectly, showToast, validateAndLoadInvite, processPendingInviteAfterAuth]);

  // Listener Sesi Kedaluwarsa (Auto-Logout 401)
  useEffect(() => {
    const handleSessionExpired = (e) => {
      setUser(null);
      setCurrentPage('login');
      const msg = e?.detail?.message || 'Sesi Anda telah berakhir. Silakan login kembali demi keamanan.';
      showToast(msg);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [showToast]);

  // Listener Popstate: Sinkronisasi Tombol Back/Forward Browser
  useEffect(() => {
    const handlePopState = () => {
      const bId = getBoardIdFromPath(window.location.pathname);
      const isReadOnly = new URLSearchParams(window.location.search).get('readOnly') === 'true';
      if (bId) {
        if (activeBoard?.id === bId) {
          setDashboardView('board-detail');
          setBoardAccessError(null);
        } else {
          loadBoardDirectly(bId, isReadOnly);
        }
      } else if (window.location.pathname.startsWith('/board/')) {
        setBoardAccessError({
          status: 404,
          message: 'Format URL board tidak valid atau ID board tidak ditemukan.',
        });
        setDashboardView('board-error');
      } else {
        setActiveBoard(null);
        setBoardAccessError(null);
        setDashboardView('workspace-detail');
        setActiveNav('workspace');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeBoard, loadBoardDirectly]);

  // Active Workspace Object
  const activeWorkspace = useMemo(() => {
    if (!workspaces || workspaces.length === 0) return null;
    return workspaces.find((ws) => ws.id === activeWorkspaceId) || workspaces[0];
  }, [workspaces, activeWorkspaceId]);

  // Recent Workspaces for Sidebar
  const recentWorkspaces = useMemo(() => {
    return workspaces.filter((ws) => ws.isRecent);
  }, [workspaces]);

  // Filtered Workspaces for Grid
  const filteredWorkspaces = useMemo(() => {
    if (!workspaces || !Array.isArray(workspaces)) return [];
    if (!searchQuery.trim()) return workspaces;
    const q = searchQuery.toLowerCase();
    return workspaces.filter((ws) => 
      (ws?.name && ws.name.toLowerCase().includes(q)) ||
      (ws?.description && ws.description.toLowerCase().includes(q))
    );
  }, [workspaces, searchQuery]);

  // Auth Handlers
  const handleLoginSuccess = async (userData) => {
    const formattedUser = {
      id: userData.id,
      name: userData.name || userData.email.split('@')[0],
      fullName: userData.name ? `${userData.name} (Anda)` : `${userData.email} (Anda)`,
      email: userData.email,
      avatarUrl: getUserAvatar(userData),
      isOnline: true
    };
    setUser(formattedUser);
    showToast("Berhasil masuk! Mengarahkan ke Dashboard...");
    setCurrentPage('dashboard');
    setDashboardView('workspace-detail');

    // Auto join workspace jika ada pending invite
    const joinedWsId = await processPendingInviteAfterAuth(formattedUser);

    await fetchWorkspaces(formattedUser);

    if (joinedWsId) {
      setActiveWorkspaceId(joinedWsId);
      setDashboardView('workspace-detail');
      setActiveNav('workspace');
    }

    // Cek apakah ada redirect ke board
    const redirectPath = sessionStorage.getItem('redirect_after_login');
    if (redirectPath) {
      sessionStorage.removeItem('redirect_after_login');
      const targetBoardId = getBoardIdFromPath(redirectPath);
      const isReadOnly = new URLSearchParams(redirectPath.split('?')[1] || '').get('readOnly') === 'true';
      if (targetBoardId) {
        await loadBoardDirectly(targetBoardId, isReadOnly);
      }
    }
  };

  const handleRegisterSuccess = async (userData) => {
    const formattedUser = {
      id: userData.id,
      name: userData.name || userData.email.split('@')[0],
      fullName: userData.name ? `${userData.name} (Anda)` : `${userData.email} (Anda)`,
      email: userData.email,
      avatarUrl: userData.avatarUrl || localStorage.getItem('retro_user_avatar') || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}&mouth=smile,twinkle&eyes=default,happy,wink`,
      isOnline: true
    };
    setUser(formattedUser);
    showToast(`Akun "${formattedUser.name}" berhasil dibuat!`);
    setCurrentPage('dashboard');
    setDashboardView('workspace-detail');

    // Auto join workspace jika ada pending invite
    const joinedWsId = await processPendingInviteAfterAuth(formattedUser);

    await fetchWorkspaces(formattedUser);

    if (joinedWsId) {
      setActiveWorkspaceId(joinedWsId);
      setDashboardView('workspace-detail');
      setActiveNav('workspace');
    }

    // Cek apakah ada redirect ke board
    const redirectPath = sessionStorage.getItem('redirect_after_login');
    if (redirectPath) {
      sessionStorage.removeItem('redirect_after_login');
      const targetBoardId = getBoardIdFromPath(redirectPath);
      const isReadOnly = new URLSearchParams(redirectPath.split('?')[1] || '').get('readOnly') === 'true';
      if (targetBoardId) {
        await loadBoardDirectly(targetBoardId, isReadOnly);
      }
    }
  };

  // Handler: 1-Click Live Demo Session
  const handleStartDemoSession = async () => {
    try {
      showToast('Menyiapkan sesi Demo RetroNerve...');
      const res = await api.loginDemo();
      if (res && res.user && res.accessToken) {
        localStorage.setItem('access_token', res.accessToken);
        const formattedUser = {
          id: res.user.id,
          name: res.user.name || 'Tamu Demo',
          fullName: `${res.user.name || 'Tamu Demo'} (Demo)`,
          email: res.user.email,
          avatarUrl: getUserAvatar(res.user),
          isOnline: true,
        };
        setUser(formattedUser);

        // Auto join workspace jika ada pending invite
        const joinedWsId = await processPendingInviteAfterAuth(formattedUser);

        await fetchWorkspaces(formattedUser);

        setCurrentPage('dashboard');
        if (joinedWsId) {
          setActiveWorkspaceId(joinedWsId);
          setDashboardView('workspace-detail');
          setActiveNav('workspace');
        } else if (res.boardId) {
          if (res.workspaceId) {
            setActiveWorkspaceId(res.workspaceId);
          }
          await loadBoardDirectly(res.boardId);
        } else {
          setDashboardView('workspace-detail');
        }
        showToast('Selamat datang di Live Demo RetroNerve!');
      }
    } catch (err) {
      console.error('Gagal memulai live demo:', err);
      showToast('Gagal memulai sesi demo. Silakan coba lagi.');
      throw err;
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentPage('landing');
    showToast('Berhasil keluar dari akun');
  };

  // Handler: Create Workspace
  const handleCreateWorkspace = async (newWsData) => {
    const wsName = newWsData.name.trim();
    const initial = wsName.charAt(0).toUpperCase();

    const currentOwner = {
      id: user.id || 'user_owner',
      name: user.fullName || `${user.name} (Anda)`,
      role: 'Owner',
      email: user.email,
      avatar: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}&mouth=smile,twinkle&eyes=default,happy,wink`,
      isOnline: true,
    };

    try {
      const res = await api.createWorkspace(wsName);
      const wsId = res.workspace?.id || res.id || `ws_${Date.now()}`;

      const chosenColor = newWsData.color || getConsistentWorkspaceColor({ id: wsId, name: wsName });
      saveWorkspaceColor(wsId, chosenColor, wsName);

      const newWorkspaceObj = {
        id: wsId,
        name: wsName,
        initial,
        color: chosenColor,
        role: 'Owner',
        description: newWsData.description || `Workspace untuk tim ${wsName}`,
        longDescription: `Workspace untuk tim ${wsName}. Semua retrospective dan diskusi tim dilakukan di sini`,
        memberCount: 1,
        dateText: `Dibuat baru saja`,
        isRecent: true,
        members: [currentOwner],
        boards: [], // Clean empty boards for newly created workspace
      };

      setWorkspaces((prev) => [newWorkspaceObj, ...prev]);
      setActiveWorkspaceId(wsId);
      setDashboardView('workspace-detail');
      showToast(`Workspace "${wsName}" berhasil dibuat!`);
    } catch (err) {
      showToast(err.message || 'Gagal membuat workspace');
    }
  };

  // Handler: Create Board within Active Workspace
  const handleCreateBoard = async (newBoardData) => {
    if (!activeWorkspace) return;

    setWorkspaces((prev) => {
      return prev.map((ws) => {
        if (ws.id === activeWorkspace.id) {
          const currentBoards = ws.boards || [];
          return {
            ...ws,
            boards: [newBoardData, ...currentBoards]
          };
        }
        return ws;
      });
    });

    showToast(`Board "${newBoardData.title}" berhasil dibuat!`);

    // Sync to backend
    try {
      const saved = await api.createBoard(activeWorkspace.id, {
        name: newBoardData.title,
        template: newBoardData.template || 'went-well-wrong-action',
      });
      const realBoard = saved?.board || saved;
      // Update the board with the real ID from backend
      if (realBoard?.id) {
        setWorkspaces((prev) =>
          prev.map((ws) => {
            if (ws.id !== activeWorkspace.id) return ws;
            return {
              ...ws,
              boards: (ws.boards || []).map((b) =>
                b.id === newBoardData.id ? { ...b, id: realBoard.id, dbId: realBoard.id } : b
              ),
            };
          })
        );
        setActiveBoard((prev) => {
          if (prev && prev.id === newBoardData.id) {
            return { ...prev, id: realBoard.id, dbId: realBoard.id, columns: realBoard.columns || prev.columns };
          }
          return prev;
        });
        window.history.replaceState({}, '', `/board/${realBoard.id}`);
        return realBoard;
      }
    } catch {
      // Local state already updated — backend might be offline
    }
    return newBoardData;
  };

  // Handler: Open Retrospective Board
  const handleOpenBoard = (board, readOnly = false) => {
    setIsWizardModalOpen(false);
    setIsCreateBoardModalOpen(false);
    if (board?.workspaceId && board.workspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(board.workspaceId);
    }
    setActiveBoard({
      ...board,
      initialReadOnly: readOnly,
    });
    setBoardAccessError(null);
    setDashboardView('board-detail');
    setActiveNav('my-boards');
    const qs = readOnly ? '?readOnly=true' : '';
    window.history.pushState({}, '', `/board/${board.id}${qs}`);
    showToast(`Membuka sesi: ${board.title || board.name}`);
  };

  // Handler: Back to Workspace / Dashboard (Reset URL ke /)
  const handleBackToWorkspace = () => {
    setActiveBoard(null);
    setBoardAccessError(null);
    setDashboardView('workspace-detail');
    setActiveNav('workspace');
    window.history.pushState({}, '', '/');
  };

  // Handler: Navigate to All Workspaces View
  const handleNavigateAllWorkspaces = () => {
    setActiveBoard(null);
    setBoardAccessError(null);
    setDashboardView('all-workspaces');
    setActiveNav('workspace');
    window.history.pushState({}, '', '/');
  };

  // Handler: Update Workspace Info
  const handleUpdateWorkspace = async (workspaceId, updateData) => {
    try {
      if (updateData.color) {
        saveWorkspaceColor(workspaceId, updateData.color, updateData.name);
      }
      await api.updateWorkspace(workspaceId, updateData);
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === workspaceId
            ? {
                ...w,
                name: updateData.name || w.name,
                initial: (updateData.name || w.name).substring(0, 1).toUpperCase(),
                color: updateData.color || w.color,
                description: updateData.description || w.description,
                longDescription: updateData.description || w.longDescription,
              }
            : w
        )
      );
      showToast(`Workspace "${updateData.name || 'berhasil'}" diperbarui!`);
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui workspace');
    }
  };

  // Handler: Delete Board
  const handleDeleteBoard = async (boardId, boardTitle) => {
    setWorkspaces((prev) =>
      prev.map((ws) => ({
        ...ws,
        boards: (ws.boards || []).filter((b) => b.id !== boardId),
      }))
    );
    showToast(`Board "${boardTitle || ''}" berhasil dihapus`);
    try {
      await api.deleteBoard(boardId);
    } catch (err) {
      showToast(err.message || 'Gagal menghapus board di server');
    }
  };

  // Handler: Delete Workspace
  const handleDeleteWorkspace = async (workspaceId, workspaceName) => {
    setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId));
    if (activeWorkspaceId === workspaceId) {
      const remaining = workspaces.filter((w) => w.id !== workspaceId);
      if (remaining.length > 0) {
        setActiveWorkspaceId(remaining[0].id);
      }
    }
    showToast(`Workspace "${workspaceName || ''}" berhasil dihapus`);
    try {
      await api.deleteWorkspace(workspaceId);
    } catch {
      // Ignored
    }
  };

  // Handler: Select Workspace from Sidebar or Switcher
  const handleSelectWorkspace = (wsId) => {
    setActiveWorkspaceId(wsId);
    setDashboardView('workspace-detail');
    setActiveNav('workspace');
  };

  return (
    <>
      {/* 0. Landing Page */}
      {currentPage === 'landing' && (
        <LandingPage 
          onNavigateLogin={() => setCurrentPage('login')}
          onNavigateRegister={() => setCurrentPage('register')}
          onDirectDashboard={handleStartDemoSession}
        />
      )}

      {/* 1. Auth: Login Page */}
      {currentPage === 'login' && (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess}
          onNavigateRegister={() => setCurrentPage('register')}
          onNavigateLanding={() => setCurrentPage('landing')}
          pendingInvite={inviteData ? { workspaceName: inviteData.workspace?.name } : null}
        />
      )}

      {/* 2. Auth: Register Page */}
      {currentPage === 'register' && (
        <RegisterPage 
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateLogin={() => setCurrentPage('login')}
          onNavigateLanding={() => setCurrentPage('landing')}
          pendingInvite={inviteData ? { workspaceName: inviteData.workspace?.name } : null}
        />
      )}

      {/* 3. Dashboard Application */}
      {currentPage === 'dashboard' && (
        <div className="dashboard-layout">
          {/* Left Sidebar */}
          <Sidebar 
            navItems={sidebarNavItems}
            activeNav={activeNav}
            onSelectNav={(navId) => {
              if (activeBoard || window.location.pathname.startsWith('/board/')) {
                setActiveBoard(null);
                setBoardAccessError(null);
                window.history.pushState({}, '', '/');
              }
              if (navId === 'workspace') {
                setActiveNav('workspace');
                setDashboardView('workspace-detail');
                window.history.pushState({}, '', '/');
              } else if (navId === 'my-boards') {
                setActiveNav('my-boards');
                setDashboardView('my-boards');
                window.history.pushState({}, '', '/');
              } else if (navId === 'activity') {
                setActiveNav('activity');
                setDashboardView('activity');
                window.history.pushState({}, '', '/');
              } else if (navId === 'templates') {
                setActiveNav('templates');
                setDashboardView('templates');
                window.history.pushState({}, '', '/');
              } else if (navId === 'settings') {
                setActiveNav('settings');
                setDashboardView('settings');
                window.history.pushState({}, '', '/');
              } else {
                showToast(`Menu ${navId} akan hadir pada update berikutnya`);
              }
            }}
            recentWorkspaces={recentWorkspaces}
            activeWorkspaceId={activeWorkspaceId}
            onSelectWorkspace={handleSelectWorkspace}
            currentUser={user}
            onLogout={handleLogout}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />

          <ErrorBoundary onReset={handleBackToWorkspace}>
            {isLoadingAuth ? (
              /* Loading Indicator during Auth/Workspaces Fetch */
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 40px)', color: '#64748b', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Loader2 size={36} color="#5956e9" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Memuat workspace...</span>
                </div>
              </div>
            ) : isBoardDirectLoading ? (
              /* Loading Indicator during Direct Board Load */
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 40px)', color: '#64748b', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
                  <Loader2 size={40} color="#5956e9" style={{ animation: 'spin 1s linear infinite' }} />
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Memvalidasi & Memuat Board...</h3>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>Memverifikasi izin akses workspace Anda</span>
                  </div>
                </div>
              </div>
            ) : boardAccessError ? (
              /* Access Denied (403) or Not Found (404) Screen */
              <div className="board-access-error-container">
                <div className="board-access-error-card">
                  <div className={`board-access-error-icon-box ${boardAccessError.status === 403 ? 'forbidden' : 'not-found'}`}>
                    {boardAccessError.status === 403 ? (
                      <ShieldAlert size={44} />
                    ) : (
                      <SearchX size={44} />
                    )}
                  </div>

                  <div className={`board-access-error-badge ${boardAccessError.status === 403 ? 'forbidden' : 'not-found'}`}>
                    {boardAccessError.status === 403 ? '403 · Akses Ditolak' : '404 · Board Tidak Ditemukan'}
                  </div>

                  <h2 className="board-access-error-title">
                    {boardAccessError.status === 403 ? 'Akses Board Dibatasi' : 'Sesi Board Tidak Ditemukan'}
                  </h2>

                  <p className="board-access-error-desc">
                    {boardAccessError.message}
                  </p>

                  {boardAccessError.status === 403 ? (
                    <div className="board-access-error-tip">
                      <strong>Catatan Keamanan:</strong> Retrospective ini bersifat privat. Hanya anggota workspace yang terdaftar dan telah diautentikasi yang diizinkan untuk melihat serta berpartisipasi dalam sesi ini.
                    </div>
                  ) : (
                    <div className="board-access-error-tip not-found-tip">
                      <strong>Kemungkinan Penyebab:</strong>
                      <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', color: '#475569', fontSize: '12px', lineHeight: '1.6' }}>
                        <li>UUID board salah disalin atau URL terpotong.</li>
                        <li>Board telah dihapus oleh fasilitator atau pemilik workspace.</li>
                        <li>Board berada pada workspace yang berbeda atau akun lain.</li>
                      </ul>
                    </div>
                  )}

                  <div className="board-access-error-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleBackToWorkspace}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600, borderRadius: '8px' }}
                    >
                      <ArrowLeft size={16} />
                      <span>Kembali ke Dashboard</span>
                    </button>

                    {boardAccessError.status === 404 && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setBoardAccessError(null);
                          setDashboardView('all-workspaces');
                          window.history.pushState({}, '', '/');
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600, borderRadius: '8px' }}
                      >
                        <Compass size={16} />
                        <span>Jelajahi Workspace Lain</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Interactive Retrospective Board View (When a board is opened) */}
                {dashboardView === 'board-detail' && activeBoard && (
                  <RetroBoardDetail 
                    key={activeBoard.id}
                    workspace={activeWorkspace}
              board={activeBoard}
              currentUser={user}
              onBack={handleBackToWorkspace}
              onNavigateAllWorkspaces={handleNavigateAllWorkspaces}
              onSwitchBoard={handleOpenBoard}
              onShowToast={showToast}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              onUpdateBoard={(updated) => {
                setActiveBoard((prev) => (prev ? { ...prev, ...updated } : prev));
                setWorkspaces((prevWs) =>
                  prevWs.map((ws) => ({
                    ...ws,
                    boards: (ws.boards || []).map((b) =>
                      b.id === updated.id ? { ...b, ...updated } : b
                    ),
                  }))
                );
              }}
            />
          )}

          {/* Workspace Boards View */}
          {dashboardView === 'workspace-detail' && activeWorkspace && (
            <WorkspaceBoardsView 
              workspace={activeWorkspace}
              workspaces={workspaces}
              currentUser={user}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              onSelectWorkspace={handleSelectWorkspace}
              onOpenBoard={handleOpenBoard}
              onCreateBoardModalOpen={() => setIsWizardModalOpen(true)}
              onCreateWorkspaceModalOpen={() => setIsCreateModalOpen(true)}
              onInviteModalOpen={() => setIsInviteModalOpen(true)}
              onDeleteWorkspace={handleDeleteWorkspace}
              onUpdateWorkspace={handleUpdateWorkspace}
              onDeleteBoard={handleDeleteBoard}
              onUpdateBoard={(updated) => {
                setActiveBoard((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
                setWorkspaces((prevWs) =>
                  prevWs.map((ws) => ({
                    ...ws,
                    boards: (ws.boards || []).map((b) =>
                      b.id === updated.id ? { ...b, ...updated } : b
                    ),
                  }))
                );
              }}
              onShowToast={showToast}
              onNavigateAllWorkspaces={handleNavigateAllWorkspaces}
            />
          )}

          {/* My Boards View */}
          {dashboardView === 'my-boards' && (
            <MyBoardsView 
              workspace={activeWorkspace}
              workspaces={workspaces}
              currentUser={user}
              onCreateBoardModalOpen={() => setIsWizardModalOpen(true)}
              onOpenBoard={handleOpenBoard}
              onDeleteBoard={handleDeleteBoard}
              onShowToast={showToast}
            />
          )}

          {/* Empty Workspace State (When user has 0 workspaces) */}
          {dashboardView === 'workspace-detail' && !activeWorkspace && !isLoadingAuth && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', width: '100%' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#f3f0ff', color: '#5956e9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <LayoutGrid size={32} />
              </div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
                Selamat Datang di RetroNerve, {user?.name || 'User'}!
              </h2>
              <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '15px', maxWidth: '480px', lineHeight: '1.6' }}>
                Anda belum memiliki workspace. Silakan buat workspace pertama Anda untuk mulai mengelola sesi retrospective bersama tim!
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCreateModalOpen(true)}
                style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 600 }}
              >
                + Buat Workspace Pertama Anda
              </button>
            </div>
          )}

          {/* All Workspaces Grid View (If user wants to see all workspaces) */}
          {dashboardView === 'all-workspaces' && (
            <div style={{ display: 'flex', width: '100%' }}>
              <main className="dashboard-main-content">
                <WorkspaceHeader 
                  onCreateWorkspace={() => setIsCreateModalOpen(true)} 
                />

                <section className="workspaces-section">
                  <div className="section-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={() => setDashboardView('workspace-detail')}
                        style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', fontWeight: 500 }}
                        title={`Kembali ke ${activeWorkspace?.name || 'Workspace'}`}
                      >
                        <ArrowLeft size={15} />
                        <span>Kembali ke {activeWorkspace?.name || 'Workspace'}</span>
                      </button>
                      <span style={{ color: '#cbd5e1', fontSize: '14px', userSelect: 'none' }}>/</span>
                      <span style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#475569' }}>
                        Semua Workspace
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end', maxWidth: '450px' }}>
                      <div className="switcher-search-container" style={{ flex: 1, margin: 0 }}>
                        <Search size={16} className="switcher-search-icon" />
                        <input 
                          type="text"
                          className="switcher-search-input"
                          placeholder="Cari workspace..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="view-mode-toggle">
                        <button
                          className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                          onClick={() => setViewMode('grid')}
                          title="Tampilan Grid"
                        >
                          <LayoutGrid size={16} />
                        </button>
                        <button
                          className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                          onClick={() => setViewMode('list')}
                          title="Tampilan Daftar"
                        >
                          <List size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={viewMode === 'grid' ? 'workspaces-grid' : 'workspace-list-container'}>
                    {filteredWorkspaces.map((workspace) => (
                      <WorkspaceCard 
                        key={workspace.id}
                        workspace={workspace}
                        isSelected={workspace.id === activeWorkspaceId}
                        onSelect={(id) => {
                          setActiveWorkspaceId(id);
                          setDashboardView('workspace-detail');
                        }}
                        onDeleteWorkspace={handleDeleteWorkspace}
                        viewMode={viewMode}
                      />
                    ))}

                    <CreateWorkspaceCard 
                      onClick={() => setIsCreateModalOpen(true)} 
                    />
                  </div>
                </section>

                {activeWorkspace && (
                  <WorkspaceSwitcher 
                    workspaces={workspaces}
                    activeWorkspace={activeWorkspace}
                    onSelectWorkspace={(id) => {
                      setActiveWorkspaceId(id);
                      setDashboardView('workspace-detail');
                    }}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onCreateWorkspace={() => setIsCreateModalOpen(true)}
                  />
                )}
              </main>

              {activeWorkspace && (
                <aside className="dashboard-right-sidebar">
                  <ActiveWorkspaceCard 
                    workspace={activeWorkspace} 
                    onShowToast={showToast}
                    onDeleteWorkspace={handleDeleteWorkspace}
                  />

                  <MembersListCard 
                    workspace={activeWorkspace}
                    onInviteClick={() => setIsInviteModalOpen(true)}
                    onViewAllMembers={() => showToast(`Menampilkan anggota ${activeWorkspace.name}`)}
                  />

                  <RecentBoardsCard 
                    workspace={activeWorkspace}
                    onViewAllBoards={() => setDashboardView('workspace-detail')}
                    onOpenBoard={(board) => handleOpenBoard(board)}
                  />
                </aside>
              )}
            </div>
          )}

          {/* 4. Activity Timeline View */}
          {dashboardView === 'activity' && (
            <ActivityView
              workspace={activeWorkspace}
              workspaces={workspaces}
              currentUser={user}
              onOpenBoard={(b) => handleOpenBoard(b)}
              onCreateBoard={() => {
                setSelectedTemplateForCreate(null);
                setIsCreateBoardModalOpen(true);
              }}
              onInviteMember={() => setIsInviteModalOpen(true)}
              onShowToast={showToast}
            />
          )}

          {/* 5. Templates Catalog View */}
          {dashboardView === 'templates' && (
            <TemplatesView
              workspace={activeWorkspace}
              onUseTemplate={(templateId) => {
                setSelectedTemplateForCreate(templateId);
                setIsCreateBoardModalOpen(true);
              }}
              onShowToast={showToast}
            />
          )}

          {/* 6. Settings Management View */}
          {dashboardView === 'settings' && (
            <SettingsView
              currentUser={user}
              workspace={activeWorkspace}
              onUpdateUser={(updated) => {
                setUser(updated);
                try {
                  localStorage.setItem('retro_user_avatar', updated.avatarUrl);
                } catch {}
                setWorkspaces((prev) =>
                  prev.map((ws) => ({
                    ...ws,
                    members: (ws.members || []).map((m) =>
                      m.id === updated.id || m.userId === updated.id || (m.email && m.email === updated.email)
                        ? { ...m, name: `${updated.name} (Anda)`, avatar: updated.avatarUrl, avatarUrl: updated.avatarUrl }
                        : m
                    ),
                  }))
                );
              }}
              onUpdateWorkspace={handleUpdateWorkspace}
              onDeleteWorkspace={handleDeleteWorkspace}
              onInviteMember={() => setIsInviteModalOpen(true)}
              onShowToast={showToast}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
            />
          )}
              </>
            )}
          </ErrorBoundary>

          {/* Modals */}
          <CreateWorkspaceModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateWorkspace}
          />

          <CreateBoardModal 
            isOpen={isCreateBoardModalOpen}
            onClose={() => {
              setIsCreateBoardModalOpen(false);
              setSelectedTemplateForCreate(null);
            }}
            onCreateBoard={async (board) => {
              setIsCreateBoardModalOpen(false);
              const created = await handleCreateBoard(board);
              handleOpenBoard(created || board);
            }}
            workspaceName={activeWorkspace?.name}
            workspace={activeWorkspace}
            workspaces={workspaces}
            initialTemplateId={selectedTemplateForCreate}
          />

          <BuatRetroWizardModal 
            isOpen={isWizardModalOpen}
            onClose={() => setIsWizardModalOpen(false)}
            onCreateBoard={handleCreateBoard}
            onOpenBoard={(board) => {
              setIsWizardModalOpen(false);
              handleOpenBoard(board);
            }}
            workspace={activeWorkspace}
            currentUser={user}
          />


          {activeWorkspace && (
            <InviteMemberModal 
              isOpen={isInviteModalOpen}
              onClose={() => setIsInviteModalOpen(false)}
              workspaceId={activeWorkspace.id}
              workspaceName={activeWorkspace.name}
              onShowToast={showToast}
            />
          )}
        </div>
      )}

      {/* Workspace Invitation Preview & Join Modal */}
      <JoinWorkspaceModal 
        isOpen={isJoinModalOpen}
        onClose={handleCloseJoinModal}
        inviteData={inviteData}
        isLoading={isInviteLoading}
        error={inviteError}
        currentUser={user}
        onJoin={handleJoinWorkspace}
        isJoining={isJoiningWorkspace}
        onNavigateLogin={() => setCurrentPage('login')}
        onNavigateRegister={() => setCurrentPage('register')}
        onStartDemo={handleStartDemoSession}
      />

      {/* Global Notification Toast */}
      <Toast 
        message={toastMessage} 
        isVisible={isToastVisible} 
      />
    </>
  );
}
