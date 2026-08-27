import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { api } from './services/api';

// Data
import { 
  currentUser as defaultUser, 
  sidebarNavItems 
} from './data/dummyData';

// Auth Pages
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';

// Layout & Workspace Components
import Sidebar from './components/layout/Sidebar';
import WorkspaceHeader from './components/workspace/WorkspaceHeader';
import WorkspaceList from './components/workspace/WorkspaceList';
import WorkspaceCard from './components/workspace/WorkspaceCard';
import CreateWorkspaceCard from './components/workspace/CreateWorkspaceCard';
import WorkspaceSwitcher from './components/workspace/WorkspaceSwitcher';
import ActiveWorkspaceCard from './components/workspace/ActiveWorkspaceCard';
import MembersListCard from './components/workspace/MembersListCard';
import RecentBoardsCard from './components/workspace/RecentBoardsCard';

// Modals & Feedback
import CreateWorkspaceModal from './components/modals/CreateWorkspaceModal';
import InviteMemberModal from './components/modals/InviteMemberModal';
import Toast from './components/common/Toast';

const colorPresets = ['gradient-blue', 'gradient-orange', 'gradient-purple', 'gradient-green', 'gradient-pink'];

function formatBackendWorkspace(ws, currentUserId) {
  const userMember = ws.members?.find((m) => m.userId === currentUserId || m.user?.id === currentUserId);
  const role = userMember ? (userMember.role === 'owner' ? 'Owner' : 'Member') : 'Member';
  const name = ws.name || 'Workspace';
  const initial = name.substring(0, 2).toUpperCase();

  const formattedMembers = (ws.members || []).map((m) => ({
    id: m.id || m.userId,
    name: m.user?.name || m.user?.email?.split('@')[0] || 'Member',
    role: m.role === 'owner' ? 'Owner' : 'Member',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user?.email || m.userId}`,
    isOnline: true,
  }));

  const formattedBoards = (ws.boards || []).map((b, idx) => ({
    id: b.id,
    title: b.name,
    columnsCount: 3,
    cardsCount: 0,
    timeText: b.createdAt ? new Date(b.createdAt).toLocaleDateString('id-ID') : 'Baru saja',
    color: colorPresets[idx % colorPresets.length],
  }));

  const colorIndex = Math.abs((ws.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colorPresets.length;

  return {
    id: ws.id,
    name: ws.name,
    initial,
    color: colorPresets[colorIndex],
    role,
    description: `Workspace untuk ${ws.name}`,
    longDescription: `Workspace untuk ${ws.name}. Semua retrospective dan diskusi tim dilakukan di sini`,
    memberCount: formattedMembers.length,
    dateText: ws.joinedAt ? `Bergabung ${new Date(ws.joinedAt).toLocaleDateString('id-ID')}` : 'Active',
    isRecent: true,
    members: formattedMembers,
    recentBoards: formattedBoards,
  };
}

export default function App() {
  // Page Routing State: 'login' | 'register' | 'dashboard'
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(defaultUser);

  // Dashboard States
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [activeNav, setActiveNav] = useState('workspace');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Toast State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Trigger Toast Notification
  const showToast = useCallback((message) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);
  }, []);

  // Fetch Workspaces from Backend API
  const fetchWorkspaces = useCallback(async (currentUserId) => {
    try {
      const data = await api.getWorkspaces();
      const formatted = (data || []).map((ws) => formatBackendWorkspace(ws, currentUserId));
      setWorkspaces(formatted);
      if (formatted.length > 0) {
        setActiveWorkspaceId((prev) => {
          if (prev && formatted.some((w) => w.id === prev)) return prev;
          return formatted[0].id;
        });
      } else {
        setActiveWorkspaceId(null);
      }
      return formatted;
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
      return [];
    }
  }, []);

  // Process Pending Invite Join from SessionStorage
  const checkAndProcessPendingInvite = useCallback(async (userData) => {
    const pendingToken = sessionStorage.getItem('pending_invite_token');
    if (pendingToken) {
      try {
        const res = await api.joinWorkspace(pendingToken);
        showToast(res.message || 'Berhasil bergabung ke workspace!');
        sessionStorage.removeItem('pending_invite_token');
        await fetchWorkspaces(userData.id);
      } catch (err) {
        showToast(err.message || 'Gagal bergabung ke workspace via link invite');
        sessionStorage.removeItem('pending_invite_token');
      }
    }
  }, [fetchWorkspaces, showToast]);

  // Handle URL Query Params for Invite Links (?invite=TOKEN)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');
    if (inviteToken) {
      sessionStorage.setItem('pending_invite_token', inviteToken);
      // Clean query parameter from URL bar
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      showToast('Link invite terdeteksi! Silakan masuk atau mendaftar untuk bergabung.');
    }
  }, [showToast]);

  // Initial Auth Check on Mount
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await api.getMe();
          const formattedUser = {
            id: userData.id,
            name: userData.name || userData.email.split('@')[0],
            fullName: userData.name ? `${userData.name} (Anda)` : `${userData.email} (Anda)`,
            email: userData.email,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
          };
          setUser(formattedUser);
          setCurrentPage('dashboard');
          await fetchWorkspaces(userData.id);
          await checkAndProcessPendingInvite(formattedUser);
        } catch {
          api.logout();
          setCurrentPage('login');
        }
      }
    }
    checkAuth();
  }, [fetchWorkspaces, checkAndProcessPendingInvite]);

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
    if (!searchQuery.trim()) return workspaces;
    return workspaces.filter((ws) => 
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workspaces, searchQuery]);

  // Auth Handlers
  const handleLoginSuccess = async (userData) => {
    const formattedUser = {
      id: userData.id,
      name: userData.name || userData.email.split('@')[0],
      fullName: userData.name ? `${userData.name} (Anda)` : `${userData.email} (Anda)`,
      email: userData.email,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
    };
    setUser(formattedUser);
    showToast("Berhasil masuk! Mengarahkan ke Dashboard...");
    setCurrentPage('dashboard');
    await fetchWorkspaces(userData.id);
    await checkAndProcessPendingInvite(formattedUser);
  };

  const handleRegisterSuccess = async (userData) => {
    const formattedUser = {
      id: userData.id,
      name: userData.name || userData.email.split('@')[0],
      fullName: userData.name ? `${userData.name} (Anda)` : `${userData.email} (Anda)`,
      email: userData.email,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
    };
    setUser(formattedUser);
    showToast(`Akun "${formattedUser.name}" berhasil dibuat!`);
    setCurrentPage('dashboard');
    await fetchWorkspaces(userData.id);
    await checkAndProcessPendingInvite(formattedUser);
  };

  const handleLogout = () => {
    api.logout();
    setUser(defaultUser);
    setWorkspaces([]);
    setActiveWorkspaceId(null);
    setCurrentPage('login');
    showToast('Berhasil keluar dari akun');
  };

  // Handler: Create Workspace
  const handleCreateWorkspace = async (newWsData) => {
    try {
      const res = await api.createWorkspace(newWsData.name);
      showToast(`Workspace "${newWsData.name}" berhasil dibuat!`);
      const updatedList = await fetchWorkspaces(user.id);
      if (res.workspace?.id) {
        setActiveWorkspaceId(res.workspace.id);
      } else if (updatedList.length > 0) {
        setActiveWorkspaceId(updatedList[0].id);
      }
    } catch (err) {
      showToast(err.message || 'Gagal membuat workspace');
    }
  };

  // Handler: Delete Workspace
  const handleDeleteWorkspace = async (workspaceId, workspaceName) => {
    try {
      await api.deleteWorkspace(workspaceId);
      showToast(`Workspace "${workspaceName || ''}" berhasil dihapus`);
      await fetchWorkspaces(user.id);
    } catch (err) {
      showToast(err.message || 'Gagal menghapus workspace');
    }
  };

  return (
    <>
      {/* Conditional Rendering of Pages */}
      {currentPage === 'login' && (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess}
          onNavigateRegister={() => setCurrentPage('register')}
        />
      )}

      {currentPage === 'register' && (
        <RegisterPage 
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateLogin={() => setCurrentPage('login')}
        />
      )}

      {currentPage === 'dashboard' && (
        <div className="dashboard-layout">
          {/* 1. Left Sidebar */}
          <Sidebar 
            navItems={sidebarNavItems}
            activeNav={activeNav}
            onSelectNav={setActiveNav}
            recentWorkspaces={recentWorkspaces}
            activeWorkspaceId={activeWorkspaceId}
            onSelectWorkspace={setActiveWorkspaceId}
            currentUser={user}
            onLogout={handleLogout}
          />

          {/* 2. Central Main Content */}
          <main className="dashboard-main-content">
            <WorkspaceHeader 
              onCreateWorkspace={() => setIsCreateModalOpen(true)} 
            />

            {/* Section: Semua Workspace */}
            <section className="workspaces-section">
              <div className="section-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Semua Workspace</h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end', maxWidth: '450px' }}>
                  {/* Search Bar */}
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

                  {/* View Mode Toggle */}
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

              {/* Cards Grid / List */}
              <WorkspaceList 
                workspaces={filteredWorkspaces}
                activeWorkspaceId={activeWorkspaceId}
                onSelectWorkspace={setActiveWorkspaceId}
                onDeleteWorkspace={handleDeleteWorkspace}
                onCreateWorkspace={() => setIsCreateModalOpen(true)}
                viewMode={viewMode}
              />
            </section>
          </main>

          {/* 3. Right Sidebar Detail Panels */}
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
                onViewAllMembers={() => alert(`Menampilkan semua anggota ${activeWorkspace.name}`)}
              />

              <RecentBoardsCard 
                workspace={activeWorkspace}
                onViewAllBoards={() => alert(`Menampilkan semua board di ${activeWorkspace.name}`)}
                onOpenBoard={(board) => showToast(`Membuka board: ${board.title}`)}
              />
            </aside>
          )}

          {/* Modals */}
          <CreateWorkspaceModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateWorkspace}
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

      {/* Global Notification Toast */}
      <Toast 
        message={toastMessage} 
        isVisible={isToastVisible} 
      />
    </>
  );
}
