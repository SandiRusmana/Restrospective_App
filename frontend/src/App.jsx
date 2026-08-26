import React, { useState, useMemo } from 'react';
import { LayoutGrid, List } from 'lucide-react';

// Data
import { 
  currentUser as defaultUser, 
  initialWorkspaces, 
  sidebarNavItems 
} from './data/dummyData';

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

// Modals & Feedback
import CreateWorkspaceModal from './components/modals/CreateWorkspaceModal';
import InviteMemberModal from './components/modals/InviteMemberModal';
import Toast from './components/common/Toast';

export default function App() {
  // Page Routing State: 'login' | 'register' | 'dashboard'
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(defaultUser);

  // Dashboard States
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(initialWorkspaces[0].id);
  const [activeNav, setActiveNav] = useState('workspace');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Toast State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Active Workspace Object
  const activeWorkspace = useMemo(() => {
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

  // Trigger Toast Notification
  const showToast = (message) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);
  };

  // Auth Handlers
  const handleLoginSuccess = (loginData) => {
    if (loginData.email) {
      const namePart = loginData.email.split('@')[0];
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      setUser((prev) => ({
        ...prev,
        name: formattedName,
        fullName: `${formattedName} (Anda)`,
        email: loginData.email
      }));
    }
    showToast("Berhasil masuk! Mengarahkan ke Dashboard...");
    setCurrentPage('dashboard');
  };

  const handleRegisterSuccess = (regData) => {
    setUser((prev) => ({
      ...prev,
      name: regData.name,
      fullName: `${regData.name} (Anda)`,
      email: regData.email
    }));
    showToast(`Akun "${regData.name}" berhasil dibuat!`);
    setCurrentPage('dashboard');
  };

  // Handler: Create Workspace
  const handleCreateWorkspace = (newWsData) => {
    const newId = `ws_${Math.random().toString(36).substring(2, 9).toUpperCase()}H8J2KX6PYZQ4`;
    const newWs = {
      id: newId,
      name: newWsData.name,
      initial: newWsData.initial,
      color: newWsData.color,
      role: 'Owner',
      description: newWsData.description,
      longDescription: `Workspace untuk ${newWsData.name}. Semua retrospective dan diskusi tim dilakukan di sini`,
      memberCount: 1,
      dateText: 'Dibuat Hari ini',
      isRecent: true,
      members: [
        {
          id: 'm1',
          name: user.fullName,
          role: 'Owner',
          avatar: user.avatarUrl,
          isOnline: true
        }
      ],
      recentBoards: []
    };

    setWorkspaces((prev) => [newWs, ...prev]);
    setActiveWorkspaceId(newId);
    showToast(`Workspace "${newWsData.name}" berhasil dibuat!`);
  };

  // Handler: Invite Member
  const handleInviteMember = (inviteData) => {
    setWorkspaces((prev) => 
      prev.map((ws) => {
        if (ws.id === activeWorkspace.id) {
          const updatedMembers = [
            ...ws.members,
            {
              id: `m_${Date.now()}`,
              name: inviteData.email.split('@')[0],
              role: inviteData.role,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${inviteData.email}`,
              isOnline: false
            }
          ];
          return {
            ...ws,
            memberCount: (ws.memberCount || ws.members.length) + 1,
            members: updatedMembers
          };
        }
        return ws;
      })
    );
    showToast(`Undangan terkirim ke ${inviteData.email}!`);
  };

  return (
    <>
      {/* Demo Top Navigation Bar to easily preview all 3 screens */}
      <nav className="auth-demo-nav">
        <button 
          className={`auth-demo-btn ${currentPage === 'login' ? 'active' : ''}`}
          onClick={() => setCurrentPage('login')}
        >
          Halaman Login
        </button>
        <button 
          className={`auth-demo-btn ${currentPage === 'register' ? 'active' : ''}`}
          onClick={() => setCurrentPage('register')}
        >
          Halaman Register
        </button>
        <button 
          className={`auth-demo-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentPage('dashboard')}
        >
          Dashboard
        </button>
      </nav>

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
          />

          {/* 2. Central Main Content */}
          <main className="dashboard-main-content">
            <WorkspaceHeader 
              onCreateWorkspace={() => setIsCreateModalOpen(true)} 
            />

            {/* Section: Semua Workspace */}
            <section className="workspaces-section">
              <div className="section-header-row">
                <h2 className="section-title">Semua Workspace</h2>
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

              {/* Cards Grid / List */}
              <div className={viewMode === 'grid' ? 'workspaces-grid' : 'workspace-list-container'}>
                {filteredWorkspaces.map((workspace) => (
                  <WorkspaceCard 
                    key={workspace.id}
                    workspace={workspace}
                    isSelected={workspace.id === activeWorkspaceId}
                    onSelect={setActiveWorkspaceId}
                    viewMode={viewMode}
                  />
                ))}

                {/* Buat Workspace Baru Card (Dashed) */}
                <CreateWorkspaceCard 
                  onClick={() => setIsCreateModalOpen(true)} 
                />
              </div>
            </section>

            {/* Section: Berpindah Workspace / Switcher & Search */}
            <WorkspaceSwitcher 
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onSelectWorkspace={setActiveWorkspaceId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onCreateWorkspace={() => setIsCreateModalOpen(true)}
            />
          </main>

          {/* 3. Right Sidebar Detail Panels */}
          <aside className="dashboard-right-sidebar">
            <ActiveWorkspaceCard 
              workspace={activeWorkspace} 
              onShowToast={showToast}
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

          {/* Modals */}
          <CreateWorkspaceModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateWorkspace}
          />

          <InviteMemberModal 
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            onInvite={handleInviteMember}
            workspaceName={activeWorkspace.name}
          />
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
