import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  MoreHorizontal,
  MessageSquare,
  CheckSquare,
  Activity,
  LayoutGrid,
  ChevronDown,
  Check,
  User,
  Clock,
  AlarmClock,
  Eye,
  EyeOff,
  FileDown,
  Loader2,
  BarChart2,
  Gamepad2,
  Share2,
  Link,
  Copy,
  Edit,
  Lock,
  CheckCircle,
  X,
  Sun,
  Moon,
  Play,
  Unlock,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useBoardPusher } from '../../hooks/useBoardPusher';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import RetroColumn from './RetroColumn';
import ActionItemsTable from './ActionItemsTable';
import PreviousSessionActionItems from './PreviousSessionActionItems';
import NotificationBell from '../common/NotificationBell';
import SessionTimerBanner from './SessionTimerBanner';
import DashboardSummaryView from './DashboardSummaryView';
import CardDetailModal from '../modals/CardDetailModal';
import SessionTimerModal from '../modals/SessionTimerModal';
import SessionTimerEndedModal from '../modals/SessionTimerEndedModal';
import EditBoardModal from '../modals/EditBoardModal';
import { playChime } from '../../utils/sound';
import { getUserAvatar } from '../../utils/avatar';
import BoardSettingsModal from '../modals/BoardSettingsModal';
import ConvertToActionItemModal from '../modals/ConvertToActionItemModal';
import IcebreakerSelectModal from '../modals/IcebreakerSelectModal';
import IcebreakerOverlay from './IcebreakerOverlay';
import PresentationOverlay from './PresentationOverlay';
import RevealCardsModal from '../modals/RevealCardsModal';

// Template Columns Dictionary
const TEMPLATE_COLUMNS_MAP = {
  'start-stop-continue': [
    { id: 'start', type: 'start', title: 'START', name: 'START', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'stop', type: 'stop', title: 'STOP', name: 'STOP', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
    { id: 'continue', type: 'continue', title: 'CONTINUE', name: 'CONTINUE', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
    { id: 'action_items', type: 'continue', title: 'ACTION ITEMS', name: 'ACTION ITEMS', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
  ],
  'mad-sad-glad': [
    { id: 'mad', type: 'mad', title: 'MAD', name: 'MAD', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
    { id: 'sad', type: 'sad', title: 'SAD', name: 'SAD', color: '#d97706', bg: '#fffbeb', border: '#fde68a', badgeBg: '#fef3c7', badgeColor: '#d97706' },
    { id: 'glad', type: 'glad', title: 'GLAD', name: 'GLAD', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
  ],
  '4ls': [
    { id: 'liked', type: 'liked', title: 'LIKED', name: 'LIKED (DISUKAI)', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'learned', type: 'learned', title: 'LEARNED', name: 'LEARNED (DIPELAJARI)', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
    { id: 'lacked', type: 'lacked', title: 'LACKED', name: 'LACKED (KURANG)', color: '#d97706', bg: '#fffbeb', border: '#fde68a', badgeBg: '#fef3c7', badgeColor: '#d97706' },
    { id: 'longed', type: 'longed', title: 'LONGED FOR', name: 'LONGED FOR (DIHARAPKAN)', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', badgeBg: '#f3e8ff', badgeColor: '#9333ea' },
  ],
  '4l': [
    { id: 'liked', type: 'liked', title: 'LIKED', name: 'LIKED (DISUKAI)', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'learned', type: 'learned', title: 'LEARNED', name: 'LEARNED (DIPELAJARI)', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
    { id: 'lacked', type: 'lacked', title: 'LACKED', name: 'LACKED (KURANG)', color: '#d97706', bg: '#fffbeb', border: '#fde68a', badgeBg: '#fef3c7', badgeColor: '#d97706' },
    { id: 'longed', type: 'longed', title: 'LONGED FOR', name: 'LONGED FOR (DIHARAPKAN)', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', badgeBg: '#f3e8ff', badgeColor: '#9333ea' },
  ],
  'went-well-wrong': [
    { id: 'went_well', type: 'start', title: 'WHAT WENT WELL', name: 'WHAT WENT WELL', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'went_wrong', type: 'stop', title: 'WHAT WENT WRONG', name: 'WHAT WENT WRONG', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
    { id: 'action_items', type: 'continue', title: 'ACTION ITEMS', name: 'ACTION ITEMS', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
  ],
  sailboat: [
    { id: 'wind', type: 'start', title: 'WIND (ANGIN)', name: 'WIND (ANGIN)', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', badgeBg: '#e0f2fe', badgeColor: '#0284c7' },
    { id: 'anchor', type: 'stop', title: 'ANCHOR (JANGKAR)', name: 'ANCHOR (JANGKAR)', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', badgeBg: '#f1f5f9', badgeColor: '#64748b' },
    { id: 'rocks', type: 'stop', title: 'ROCKS (KARANG)', name: 'ROCKS (KARANG)', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
    { id: 'island', type: 'start', title: 'ISLAND (PULAU)', name: 'ISLAND (PULAU)', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
  ],
  starfish: [
    { id: 'keep_doing', type: 'continue', title: 'KEEP DOING', name: 'KEEP DOING', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
    { id: 'less_of', type: 'stop', title: 'LESS OF', name: 'LESS OF', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5', badgeBg: '#ffedd5', badgeColor: '#ea580c' },
    { id: 'more_of', type: 'start', title: 'MORE OF', name: 'MORE OF', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badgeBg: '#dbeafe', badgeColor: '#2563eb' },
    { id: 'stop_doing', type: 'stop', title: 'STOP DOING', name: 'STOP DOING', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
    { id: 'start_doing', type: 'start', title: 'START DOING', name: 'START DOING', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', badgeBg: '#ede9fe', badgeColor: '#8b5cf6' },
  ],
};

// Board navigation tabs (3 core retro phases)
const BOARD_TABS = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'action-items', label: 'Action Items', icon: CheckSquare },
];

export default function RetroBoardDetail({
  workspace,
  board,
  onBack,
  onSwitchBoard,
  currentUser,
  onShowToast,
  onUpdateBoard,
  onNavigateAllWorkspaces,
  isDarkMode,
  onToggleDarkMode,
}) {
  const boardId = board?.id;
  const [activeTab, setActiveTab] = useState('board');
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null);
  const [members, setMembers] = useState([]);

  // ── Board Settings & Anonymous Mode State ──
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(Boolean(board?.isAnonymous));
  // Mode Anonymous Personal (per-user): Setiap anggota maupun facilitator dapat mengaktifkannya untuk diri sendiri
  const [isMyAnonymous, setIsMyAnonymous] = useState(() => {
    try {
      const saved = localStorage.getItem(`retro_anon_${boardId}_${currentUser?.id || currentUser?.email || 'user'}`);
      return saved !== null ? saved === 'true' : Boolean(board?.isAnonymous);
    } catch {
      return Boolean(board?.isAnonymous);
    }
  });
  const [currentBoardTitle, setCurrentBoardTitle] = useState(
    board?.title || board?.name || 'Sprint 16 Retrospective'
  );
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);

  const handleSaveBoardTitle = async (updatedData) => {
    try {
      await api.updateBoard(boardId, {
        name: updatedData.name,
        title: updatedData.title,
        description: updatedData.description,
      });
      setCurrentBoardTitle(updatedData.title);
      if (onUpdateBoard) {
        onUpdateBoard({
          id: boardId,
          name: updatedData.name,
          title: updatedData.title,
          description: updatedData.description,
        });
      }
      if (onShowToast) {
        onShowToast(`Nama board berhasil diubah menjadi "${updatedData.title}"`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(err?.message || 'Gagal mengubah nama board');
      }
      throw err;
    }
  };

  // ── Board Status (Aktif / Selesai) ──
  const [boardStatus, setBoardStatus] = useState(() => board?.status || 'aktif');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // ── Read-Only Mode State & Share Dropdown ──
  const [isReadOnly, setIsReadOnly] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('readOnly') === 'true' || Boolean(board?.initialReadOnly) || board?.status === 'selesai';
    } catch {
      return Boolean(board?.initialReadOnly) || board?.status === 'selesai';
    }
  });
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const shareMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
        setIsShareMenuOpen(false);
      }
    };
    if (isShareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShareMenuOpen]);

  // Synchronize isReadOnly state if prop board changes
  useEffect(() => {
    if (board?.initialReadOnly !== undefined) {
      setIsReadOnly(Boolean(board.initialReadOnly));
    }
  }, [board?.initialReadOnly]);

  // ── Action Items State ──
  const [actionItems, setActionItems] = useState([]);
  const [convertModalCard, setConvertModalCard] = useState(null);
  const [boardColumns, setBoardColumns] = useState(board?.columns || []);
  const [isExporting, setIsExporting] = useState(false);

  // ── Icebreaker State ──
  const [isIcebreakerSelectModalOpen, setIsIcebreakerSelectModalOpen] = useState(false);
  const [activeIcebreaker, setActiveIcebreaker] = useState(null);

  // ── Presentation Mode State ──
  const [isPresentationOpen, setIsPresentationOpen] = useState(Boolean(board?.presentationMode));
  const [presentationCard, setPresentationCard] = useState(null);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [presentationTotal, setPresentationTotal] = useState(1);
  const [isPresentationFirst, setIsPresentationFirst] = useState(true);
  const [isPresentationLast, setIsPresentationLast] = useState(false);
  const [isNavigatingPresentation, setIsNavigatingPresentation] = useState(false);

  // ── Private Note Feature State ──
  // isPrivateMode: true selama card masih tersembunyi dari anggota lain
  // isRevealed: true setelah fasilitator melakukan reveal
  // showRevealModal: konfirmasi sebelum reveal
  // showRevealedBanner: banner sukses setelah reveal (auto-dismiss 5 detik)
  const [isPrivateMode, setIsPrivateMode] = useState(() => !Boolean(board?.isRevealed));
  const [isRevealed, setIsRevealed] = useState(() => Boolean(board?.isRevealed));
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [showRevealedBanner, setShowRevealedBanner] = useState(false);
  const [totalCardsCount, setTotalCardsCount] = useState(() => board?.totalCardsCount || 0);

  useEffect(() => {
    if (board?.isRevealed !== undefined) {
      setIsRevealed(Boolean(board.isRevealed));
      setIsPrivateMode(!Boolean(board.isRevealed));
    }
  }, [board?.isRevealed]);

  useEffect(() => {
    if (typeof board?.totalCardsCount === 'number') {
      setTotalCardsCount(board.totalCardsCount);
    }
  }, [board?.totalCardsCount]);

  // ── Previous Session Action Items State ──
  const [previousSessionItems, setPreviousSessionItems] = useState([]);

  const formatActionItem = useCallback((item) => {
    if (!item) return null;
    const dueDateDisplay = item.dueDate
      ? new Date(item.dueDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

    return {
      ...item,
      id: item.id,
      cardId: item.cardId,
      boardId: item.boardId || item.board?.id,
      boardName: item.board?.name || item.board?.title || item.boardName || 'Sesi Sebelumnya',
      title: item.title || item.card?.content || 'Action Item',
      status: item.status || 'PENDING',
      dueDate: item.dueDate,
      dueDateDisplay: item.dueDateDisplay || dueDateDisplay,
      assignee: item.assignee || null,
      description: item.description || '',
    };
  }, []);

  const loadActionItemsFromApi = useCallback(async () => {
    if (!boardId) return;
    try {
      const res = await api.getActionItems(boardId);
      if (Array.isArray(res)) {
        const formattedServerItems = res.map(formatActionItem);
        setActionItems((prev) => {
          // Pertahankan item optimistik yang belum selesai di-commit ke server
          const serverCardIds = new Set(formattedServerItems.map((s) => s.cardId));
          const serverItemIds = new Set(formattedServerItems.map((s) => s.id));
          const pendingOptimistic = prev.filter(
            (p) =>
              typeof p.id === 'string' &&
              p.id.startsWith('ai_') &&
              !serverCardIds.has(p.cardId) &&
              !serverItemIds.has(p.id)
          );
          return [...pendingOptimistic, ...formattedServerItems];
        });
      }
    } catch (err) {
      console.warn('[ActionItems] Gagal memuat action items:', err);
    }
  }, [boardId, formatActionItem]);

  // Load action items dari sesi / board sebelumnya di workspace yang sama
  const loadPreviousSessionItems = useCallback(async () => {
    const wsId = workspace?.id || board?.workspaceId;
    if (!wsId) return;
    try {
      const res = await api.getWorkspaceActionItems(wsId, 'pending');
      if (Array.isArray(res)) {
        // Filter action items dari sesi/board sebelumnya di workspace yang sama
        const prevItems = res
          .filter((item) => (item.boardId || item.board?.id) !== boardId)
          .map(formatActionItem);
        setPreviousSessionItems(prevItems);
      }
    } catch (err) {
      console.warn('[PrevSession] Gagal memuat action items sesi sebelumnya:', err);
    }
  }, [workspace?.id, board?.workspaceId, boardId, formatActionItem]);

  const handleUpdatePreviousSessionStatus = useCallback(
    async (itemId, newStatus) => {
      setPreviousSessionItems((prev) =>
        prev.map((ai) => (ai.id === itemId ? { ...ai, status: newStatus } : ai))
      );
      if (onShowToast) {
        onShowToast(`Status action item diubah menjadi ${newStatus === 'IN_PROGRESS' ? 'IN PROGRESS' : newStatus}`);
      }
      try {
        await api.updateActionItem(itemId, { status: newStatus });
      } catch (err) {
        console.error('[PrevSession] Gagal update status action item:', err);
        if (onShowToast) onShowToast('Gagal memperbarui status action item ke server');
      }
    },
    [onShowToast]
  );

  const handleUpdatePreviousSessionDueDate = useCallback(
    async (itemId, newDueDate) => {
      let formattedDisplay = '–';
      if (newDueDate) {
        const d = new Date(newDueDate);
        if (!isNaN(d.getTime())) {
          formattedDisplay = d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        }
      }
      setPreviousSessionItems((prev) =>
        prev.map((ai) =>
          ai.id === itemId
            ? {
                ...ai,
                dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
                dueDateDisplay: formattedDisplay,
              }
            : ai
        )
      );
      if (onShowToast) onShowToast('Tenggat waktu (due date) diperbarui');
      try {
        await api.updateActionItem(itemId, {
          dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
        });
      } catch (err) {
        console.error('[PrevSession] Gagal update due date action item:', err);
        if (onShowToast) onShowToast('Gagal memperbarui due date ke server');
      }
    },
    [onShowToast]
  );

  useEffect(() => {
    if (boardId) {
      loadActionItemsFromApi();
      loadPreviousSessionItems();
    }
  }, [boardId, loadActionItemsFromApi, loadPreviousSessionItems]);

  useEffect(() => {
    if (activeTab === 'action-items' && boardId) {
      loadActionItemsFromApi();
      loadPreviousSessionItems();
    }
  }, [activeTab, boardId, loadActionItemsFromApi, loadPreviousSessionItems]);

  // Sync state when board prop changes
  useEffect(() => {
    if (board) {
      setIsAnonymous(Boolean(board.isAnonymous));
      setCurrentBoardTitle(board.title || board.name || 'Sprint 16 Retrospective');
      if (board.columns && board.columns.length > 0) {
        setBoardColumns(board.columns);
      }
    }
  }, [board]);

  useEffect(() => {
    if (!boardId) return;
    api.getBoardById(boardId).then((fullBoard) => {
      if (fullBoard) {
        if (fullBoard.columns && fullBoard.columns.length > 0) {
          setBoardColumns(fullBoard.columns);
        }
        if (fullBoard.isRevealed !== undefined) {
          setIsRevealed(Boolean(fullBoard.isRevealed));
          setIsPrivateMode(!Boolean(fullBoard.isRevealed));
        }
        if (fullBoard.status) {
          setBoardStatus(fullBoard.status);
          if (fullBoard.status === 'selesai') {
            setIsReadOnly(true);
          }
        }
      }
    }).catch(() => {});
  }, [boardId]);

  // Cek apakah user saat ini adalah facilitator / admin / owner
  const isFacilitator = useMemo(() => {
    if (!currentUser) return false;
    const currentUserId = currentUser?.id || currentUser?.userId;
    if (workspace?.ownerId && workspace.ownerId === currentUserId) return true;
    const myRole = workspace?.role?.toLowerCase();
    if (['owner', 'facilitator', 'admin'].includes(myRole)) return true;
    const member = members.find(
      (m) => (m.id || m.userId) === currentUserId || m.email === currentUser?.email
    );
    if (member && ['owner', 'facilitator', 'admin'].includes(member.role?.toLowerCase())) {
      return true;
    }
    return true; // Default fallback dalam sesi retro
  }, [currentUser, workspace, members]);

  // ── Retro Session Timer State ──
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isTimerEndedModalOpen, setIsTimerEndedModalOpen] = useState(false);
  const [timerStatus, setTimerStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'ended'
  const [timerTotal, setTimerTotal] = useState(15 * 60); // 15 mins in seconds
  const [timerRemaining, setTimerRemaining] = useState(15 * 60);
  const [timerStartedById, setTimerStartedById] = useState(null);
  const [timerFacilitator, setTimerFacilitator] = useState(
    currentUser?.name || currentUser?.email?.split('@')[0] || 'Afrizal'
  );

  // Helper: Apply timer data from server or Pusher
  const applyTimerState = useCallback((data, isLiveUpdate = false) => {
    if (!data) return;
    const t = data.timer || data;

    const totalSecs = t.duration || t.totalSeconds || 900;
    setTimerTotal(totalSecs);

    let rem =
      typeof t.remaining === 'number'
        ? t.remaining
        : typeof t.remainingSeconds === 'number'
        ? t.remainingSeconds
        : totalSecs;

    if (t.isRunning && t.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(t.startedAt).getTime()) / 1000);
      rem = Math.max(0, rem - elapsed);
    }

    // Jika timer sudah tidak berjalan dan sisa waktunya 0 (sesi lama sudah selesai),
    // kembalikan ke totalSecs dan jadikan status idle saat user baru buka/refresh board
    if (!t.isRunning && rem <= 0 && !isLiveUpdate) {
      rem = totalSecs;
    }
    setTimerRemaining(rem);

    const facilitatorName = data.facilitator || t.facilitator;
    if (facilitatorName) {
      setTimerFacilitator(facilitatorName);
    }

    const starterId = data.startedById || t.startedById || data.user?.id || t.user?.id;
    if (starterId) {
      setTimerStartedById(starterId);
    }

    let nextStatus = 'idle';
    if (t.status) {
      nextStatus = t.status;
    } else if (t.isRunning) {
      nextStatus = rem > 0 ? 'running' : (isLiveUpdate ? 'ended' : 'idle');
    } else if (rem > 0 && rem < totalSecs) {
      nextStatus = 'paused';
    } else if (rem === 0 && isLiveUpdate) {
      nextStatus = 'ended';
    } else {
      nextStatus = 'idle';
    }

    setTimerStatus(nextStatus);
    // Hanya tampilkan popup modal jika timer aktif baru saja selesai (live update),
    // bukan saat baru membuka/refresh halaman yang sesi sebelumnya sudah selesai
    if (nextStatus === 'ended' && isLiveUpdate) {
      setIsTimerEndedModalOpen(true);
      playChime('timer');
    }
  }, []);

  // Fetch initial timer status from server (isLiveUpdate = false agar tidak popup saat refresh)
  useEffect(() => {
    if (!boardId) return;
    api
      .getTimer(boardId)
      .then((res) => {
        if (res) applyTimerState(res, false);
      })
      .catch((err) => console.warn('[Timer] Gagal memuat timer:', err));
  }, [boardId, applyTimerState]);

  // Sync facilitator if current user changes
  useEffect(() => {
    if (currentUser?.name && timerFacilitator === 'Afrizal') {
      setTimerFacilitator(currentUser.name);
    }
  }, [currentUser?.name]);

  // Timer Countdown Ticker
  useEffect(() => {
    let interval = null;
    if (timerStatus === 'running') {
      interval = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimerStatus('ended');
            setIsTimerEndedModalOpen(true);
            playChime('timer');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerStatus]);

  const handleStartTimer = async (durationMinutes) => {
    const totalSecs = Math.max(1, durationMinutes) * 60;
    setTimerTotal(totalSecs);
    setTimerRemaining(totalSecs);
    setTimerStatus('running');
    const currentUserId = currentUser?.id || currentUser?.userId;
    setTimerStartedById(currentUserId);
    setTimerFacilitator(currentUser?.name || currentUser?.email?.split('@')[0] || 'Anda');
    if (onShowToast) onShowToast(`Timer sesi dimulai: ${durationMinutes} menit`);

    if (!boardId) return;
    try {
      const res = await api.startTimer(boardId, totalSecs);
      if (res) applyTimerState(res, true);
    } catch (err) {
      console.warn('Gagal start timer di server:', err);
    }
  };

  const handlePauseTimer = async () => {
    setTimerStatus('paused');
    if (onShowToast) onShowToast('Timer sesi dijeda');
    if (!boardId) return;
    try {
      const res = await api.pauseTimer(boardId);
      if (res) applyTimerState(res);
    } catch (err) {
      console.warn('Gagal pause timer di server:', err);
    }
  };

  const handleResumeTimer = async () => {
    setTimerStatus('running');
    if (onShowToast) onShowToast('Timer sesi dilanjutkan');
    if (!boardId) return;
    try {
      const res = await api.startTimer(boardId);
      if (res) applyTimerState(res);
    } catch (err) {
      console.warn('Gagal resume timer di server:', err);
    }
  };

  const handleResetTimer = async () => {
    setTimerStatus('idle');
    setTimerRemaining(timerTotal);
    if (onShowToast) onShowToast('Timer sesi direset');
    if (!boardId) return;
    try {
      const res = await api.resetTimer(boardId);
      if (res) applyTimerState(res);
    } catch (err) {
      console.warn('Gagal reset timer di server:', err);
    }
  };

  const handleChangeFacilitator = (name) => {
    setTimerFacilitator(name);
    if (onShowToast) onShowToast(`Fasilitator diubah: ${name}`);
  };

  // Load Workspace Members from API
  useEffect(() => {
    const wsId = workspace?.id || board?.workspaceId;
    if (!wsId) return;
    api
      .getWorkspaceMembers(wsId)
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map((m) => ({
            id: m.userId || m.id,
            name: m.user?.name || m.name || m.user?.email?.split('@')[0] || 'Member',
            email: m.user?.email || m.email || '',
            avatarUrl: getUserAvatar(m.user || m, m.user?.name || m.name),
          }));
          setMembers(formatted);
        }
      })
      .catch(() => {});
  }, [workspace?.id, board?.workspaceId]);

  // Load Cards from API
  const loadCardsFromApi = useCallback(async () => {
    if (!boardId) return;
    try {
      const cardsData = await api.getCards(boardId);
      if (Array.isArray(cardsData)) {
        const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.email;
        const formatted = cardsData.map((c) => {
          const isOwner =
            Boolean(c.isOwner) ||
            (c.authorId && c.authorId === currentUserId) ||
            (c.author?.id && c.author.id === currentUserId) ||
            (c.author?.email && currentUser?.email && c.author.email === currentUser.email);
          const authorName = isOwner
            ? 'Anda'
            : (c.author?.name || c.author?.email?.split('@')[0] || 'Anggota');
          const authorEmail = c.author?.email || (isOwner ? (currentUser?.email || '') : '');
          const authorAvatar = isOwner && (currentUser?.avatarUrl || currentUser?.avatar)
            ? (currentUser.avatarUrl || currentUser.avatar)
            : getUserAvatar(c.author, authorName);
          const votesList = Array.isArray(c.votes) ? c.votes : [];
          const votesCount = typeof c.votesCount === 'number' ? c.votesCount : votesList.length;
          const hasVoted =
            votesList.some((v) => (v.userId || v.id || v) === currentUserId) ||
            Boolean(c.hasVoted);

          return {
            id: c.id,
            boardId: c.boardId,
            columnId: c.columnId || 'start',
            columnType: c.columnType || null,
            columnName: c.columnName || null,
            content: c.content,
            text: c.content,
            groupId: c.groupId || null,
            groupTitle: c.groupTitle || null,
            authorId: c.authorId,
            isOwner,
            isAnonymous: Boolean(c.isAnonymous),
            author: c.author,
            authorName,
            authorEmail,
            avatar: authorAvatar,
            createdAt: c.createdAt,
            time: c.createdAt
              ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Baru saja',
            votes: votesList,
            votesCount,
            hasVoted,
            comments: (c.comments || []).map((cm) => ({
              id: cm.id,
              cardId: c.id,
              content: cm.content || cm.text || '',
              text: cm.content || cm.text || '',
              userId: cm.userId,
              author: cm.user || cm.author,
              authorName: cm.user?.name || cm.authorName || 'Anggota',
              avatar: getUserAvatar(cm.user || cm.author, cm.user?.name || cm.authorName || 'Anggota'),
              createdAt: cm.createdAt,
              time: cm.createdAt
                ? new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Baru saja',
            })),
            commentsCount: c.commentsCount || (c.comments ? c.comments.length : 0),
          };
        });
        setCards(formatted);
      }
    } catch (err) {
      console.warn('Gagal memuat card dari backend:', err);
      setCards([]);
    }
  }, [boardId, currentUser]);

  useEffect(() => {
    loadCardsFromApi();
  }, [loadCardsFromApi]);

  // Hook Pusher Channels Realtime & Presence
  const { onlineMembers, onlineCount } = useBoardPusher(boardId, currentUser, {
    onCardCreated: (newCard) => {
      if (!newCard) return;
      const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.email;
      const isOwner =
        Boolean(newCard.isOwner) ||
        (newCard.authorId && newCard.authorId === currentUserId) ||
        (newCard.author?.id && newCard.author.id === currentUserId) ||
        (newCard.author?.email && currentUser?.email && newCard.author.email === currentUser.email);
      const authorName = isOwner
        ? 'Anda'
        : (newCard.author?.name || 'Anggota Tim');
      const authorEmail = newCard.author?.email || (isOwner ? (currentUser?.email || '') : '');
      const authorAvatar = isOwner && (currentUser?.avatarUrl || currentUser?.avatar)
        ? (currentUser.avatarUrl || currentUser.avatar)
        : getUserAvatar(newCard.author, authorName);
      const formattedCard = {
        ...newCard,
        content: newCard.content || newCard.text || '',
        text: newCard.content || newCard.text || '',
        authorId: newCard.authorId,
        isOwner,
        isAnonymous: Boolean(newCard.isAnonymous),
        authorName,
        authorEmail,
        avatar: authorAvatar,
        time: newCard.createdAt
          ? new Date(newCard.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Baru saja',
        votes: newCard.votes || [],
        votesCount: newCard.votesCount || (Array.isArray(newCard.votes) ? newCard.votes.length : 0),
        hasVoted: newCard.hasVoted || false,
        comments: newCard.comments || [],
        commentsCount: newCard.commentsCount || 0,
      };

      setCards((prev) => {
        // 1. Jika sudah ada berdasarkan ID nyata, jangan duplikasi
        if (prev.some((c) => c.id === formattedCard.id)) return prev;

        // 2. Jika ada temporary optimistic card dengan konten yang sama, gantikan
        const optIndex = prev.findIndex(
          (c) =>
            typeof c.id === 'string' &&
            c.id.startsWith('card_') &&
            c.content?.trim() === formattedCard.content?.trim()
        );

        if (optIndex !== -1) {
          const next = [...prev];
          next[optIndex] = formattedCard;
          return next;
        }

        return [...prev, formattedCard];
      });
    },

    onCardUpdated: (updatedCard) => {
      setCards((prev) =>
        prev.map((c) => (c.id === updatedCard.id ? { ...c, ...updatedCard } : c))
      );
      setSelectedCardForDetail((prev) =>
        prev && prev.id === updatedCard.id ? { ...prev, ...updatedCard } : prev
      );
    },

    onCardDeleted: (deletedData) => {
      const targetId = deletedData?.id || deletedData?.cardId;
      setCards((prev) => prev.filter((c) => c.id !== targetId));
      setSelectedCardForDetail((prev) => (prev && prev.id === targetId ? null : prev));
    },

    onVoteUpdated: (voteData) => {
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === voteData.cardId) {
            const currentVotes = Array.isArray(c.votes) ? [...c.votes] : [];
            const userVoteIndex = currentVotes.findIndex(
              (v) => (v.userId || v.id || v) === voteData.userId
            );

            let nextVotes;
            if (userVoteIndex >= 0) {
              nextVotes = currentVotes.filter((_, idx) => idx !== userVoteIndex);
            } else {
              nextVotes = [
                ...currentVotes,
                { userId: voteData.userId, votedAt: voteData.votedAt || new Date().toISOString() },
              ];
            }

            const currentUserId = currentUser?.id || currentUser?.email || 'current_user';
            const updatedCardObj = {
              ...c,
              votes: nextVotes,
              votesCount: nextVotes.length,
              hasVoted: nextVotes.some(
                (v) => (v.userId || v.id || v) === currentUserId
              ),
            };
            return updatedCardObj;
          }
          return c;
        })
      );

      setSelectedCardForDetail((prev) => {
        if (prev && prev.id === voteData.cardId) {
          const currentVotes = Array.isArray(prev.votes) ? [...prev.votes] : [];
          const userVoteIndex = currentVotes.findIndex(
            (v) => (v.userId || v.id || v) === voteData.userId
          );
          let nextVotes;
          if (userVoteIndex >= 0) {
            nextVotes = currentVotes.filter((_, idx) => idx !== userVoteIndex);
          } else {
            nextVotes = [
              ...currentVotes,
              { userId: voteData.userId, votedAt: voteData.votedAt || new Date().toISOString() },
            ];
          }
          const currentUserId = currentUser?.id || currentUser?.email || 'current_user';
          return {
            ...prev,
            votes: nextVotes,
            votesCount: nextVotes.length,
            hasVoted: nextVotes.some((v) => (v.userId || v.id || v) === currentUserId),
          };
        }
        return prev;
      });
    },

    onCommentCreated: (commentData) => {
      const commentObj = commentData?.comment || commentData;
      const cardId = commentObj?.cardId || commentData?.cardId;
      if (!cardId) return;

      const authorId = commentObj?.authorId || commentObj?.userId || commentObj?.author?.id;
      const isMe = authorId === currentUser?.id || authorId === currentUser?.email;

      const authorName =
        commentObj?.author?.name ||
        commentObj?.authorName ||
        commentObj?.user?.name ||
        (isMe ? (currentUser?.name || currentUser?.fullName || 'Anda') : '') ||
        'Anggota Tim';

      const authorAvatar =
        commentObj?.author?.avatarUrl ||
        commentObj?.authorAvatar ||
        commentObj?.user?.avatarUrl ||
        (isMe ? currentUser?.avatarUrl : '') ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`;

      const commentText = commentObj?.text || commentObj?.content || '';

      const formattedComment = {
        id: commentObj.id || `comment_${Date.now()}`,
        cardId,
        author: {
          id: authorId || 'author',
          name: authorName,
          avatarUrl: authorAvatar,
        },
        authorName,
        text: commentText,
        content: commentText,
        time: commentObj.time || (commentObj.createdAt ? new Date(commentObj.createdAt).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }) : 'Baru saja'),
        createdAt: commentObj.createdAt || new Date().toISOString(),
      };

      const mergeComments = (existingComments = []) => {
        // 1. Exact ID match: do not duplicate
        if (existingComments.some((cm) => cm.id === formattedComment.id)) {
          return existingComments;
        }

        // 2. Optimistic match: if created recently by current user with exact same text, update optimistic comment in-place
        const optimisticIndex = existingComments.findIndex(
          (cm) =>
            cm.id.startsWith('comment_') &&
            (cm.author?.id === authorId || cm.authorName === authorName || isMe) &&
            (cm.text === commentText || cm.content === commentText)
        );

        if (optimisticIndex !== -1) {
          const next = [...existingComments];
          next[optimisticIndex] = formattedComment;
          return next;
        }

        return [...existingComments, formattedComment];
      };

      setCards((prev) =>
        prev.map((c) => {
          if (c.id === cardId) {
            const nextComments = mergeComments(c.comments || []);
            return {
              ...c,
              comments: nextComments,
              commentCount: nextComments.length,
              commentsCount: nextComments.length,
            };
          }
          return c;
        })
      );

      setSelectedCardForDetail((prev) => {
        if (prev && prev.id === cardId) {
          const nextComments = mergeComments(prev.comments || []);
          return {
            ...prev,
            comments: nextComments,
            commentCount: nextComments.length,
            commentsCount: nextComments.length,
          };
        }
        return prev;
      });
    },

    onCardGrouped: (groupData) => {
      const targetCardId = groupData?.cardId || groupData?.id;
      if (!targetCardId) return;

      setCards((prev) =>
        prev.map((c) => {
          if (c.id === targetCardId) {
            return {
              ...c,
              groupId: groupData.groupId || null,
              groupTitle:
                groupData.groupTitle !== undefined ? groupData.groupTitle : c.groupTitle,
            };
          }
          if (
            groupData.groupId &&
            c.groupId === groupData.groupId &&
            groupData.groupTitle !== undefined
          ) {
            return { ...c, groupTitle: groupData.groupTitle };
          }
          return c;
        })
      );
    },

    onTimerUpdated: (timerData) => {
      applyTimerState(timerData, true);
    },

    onActionItemCreated: (payload) => {
      const item = payload?.actionItem || payload;
      if (!item) return;
      const formatted = formatActionItem(item);
      setActionItems((prev) => {
        const exists = prev.some(
          (ai) => ai.id === formatted.id || (ai.cardId && ai.cardId === formatted.cardId)
        );
        if (exists) {
          return prev.map((ai) =>
            ai.id === formatted.id || ai.cardId === formatted.cardId ? formatted : ai
          );
        }
        return [formatted, ...prev];
      });
    },

    onActionItemUpdated: (payload) => {
      const item = payload?.actionItem || payload;
      if (!item) return;
      const formatted = formatActionItem(item);
      setActionItems((prev) =>
        prev.map((ai) => (ai.id === formatted.id ? { ...ai, ...formatted } : ai))
      );
    },

    onAnonymousUpdated: (payload) => {
      if (payload && (payload.boardId === boardId || !payload.boardId)) {
        const newStatus = Boolean(payload.isAnonymous);
        setIsAnonymous(newStatus);
        if (onShowToast) {
          onShowToast(`Mode anonymous ${newStatus ? 'diaktifkan' : 'dinonaktifkan'} oleh fasilitator`);
        }
        loadCardsFromApi();
      }
    },

    onBoardRevealed: (payload) => {
      setIsPrivateMode(false);
      setIsRevealed(true);
      setShowRevealedBanner(true);
      if (onShowToast) {
        onShowToast('Fasilitator telah me-reveal semua kartu! Diskusi tim dimulai.');
      }
      setTimeout(() => setShowRevealedBanner(false), 5000);
      loadCardsFromApi();
    },

    onCardsCountUpdated: (data) => {
      if (typeof data?.totalCardsCount === 'number') {
        setTotalCardsCount(data.totalCardsCount);
      }
    },

    onIcebreakerStarted: (session) => {
      setActiveIcebreaker(session);
      if (onShowToast) {
        onShowToast(`Fasilitator memulai sesi Icebreaker: ${session.title || 'Emoji Mood'}!`);
      }
    },

    onIcebreakerVoted: (data) => {
      setActiveIcebreaker((prev) => {
        if (!prev) return prev;
        const updatedVotes = data.votes || {
          ...prev.votes,
          [data.userId]: {
            userId: data.userId,
            userName: data.userName,
            avatarUrl: data.avatarUrl,
            optionId: data.optionId,
          },
        };
        return { ...prev, votes: updatedVotes };
      });
    },

    onIcebreakerSkipped: (session) => {
      setActiveIcebreaker(session);
      if (onShowToast) {
        onShowToast('Pertanyaan icebreaker diganti oleh fasilitator');
      }
    },

    onIcebreakerRevealed: (session) => {
      setActiveIcebreaker(session);
      if (onShowToast) {
        onShowToast('Kunci jawaban dibuka oleh fasilitator!');
      }
    },

    onIcebreakerEnded: () => {
      setActiveIcebreaker((prev) => (prev ? { ...prev, status: 'ended' } : null));
      if (onShowToast) {
        onShowToast('Sesi icebreaker telah selesai!');
      }
    },

    onPresentationStarted: (data) => {
      setIsPresentationOpen(true);
      if (data?.card) setPresentationCard(data.card);
      setPresentationIndex(data?.currentIndex ?? 0);
      setPresentationTotal(data?.totalCards ?? 1);
      setIsPresentationFirst(Boolean(data?.isFirst));
      setIsPresentationLast(Boolean(data?.isLast));
      if (onShowToast) {
        onShowToast('Mode presentasi telah dimulai oleh fasilitator');
      }
    },

    onPresentationCardChanged: (data) => {
      setIsPresentationOpen(true);
      if (data?.card) setPresentationCard(data.card);
      setPresentationIndex(data?.currentIndex ?? 0);
      setPresentationTotal(data?.totalCards ?? 1);
      setIsPresentationFirst(Boolean(data?.isFirst));
      setIsPresentationLast(Boolean(data?.isLast));
    },

    onPresentationStopped: () => {
      setIsPresentationOpen(false);
      setPresentationCard(null);
      if (onShowToast) {
        onShowToast('Mode presentasi telah dihentikan');
      }
    },

    onBoardStatusUpdated: (data) => {
      if (data?.status) {
        setBoardStatus(data.status);
        if (data.status === 'selesai') {
          setIsReadOnly(true);
          if (onShowToast) onShowToast('Sesi retrospective telah diselesaikan oleh fasilitator');
        } else {
          setIsReadOnly(false);
          if (onShowToast) onShowToast('Sesi retrospective dibuka kembali oleh fasilitator');
        }
        if (onUpdateBoard) {
          onUpdateBoard({ id: boardId, status: data.status });
        }
      }
    },
  });

  // Check initial active icebreaker session on mount
  useEffect(() => {
    if (!boardId) return;
    api
      .getIcebreakerState(boardId)
      .then((res) => {
        if (res?.active && res.session) {
          setActiveIcebreaker(res.session);
        }
      })
      .catch(() => {});
  }, [boardId]);

  // Handler: Start Icebreaker Game
  const handleStartIcebreaker = async (gameType, totalQuestions = 5) => {
    setIsIcebreakerSelectModalOpen(false);
    try {
      const session = await api.startIcebreaker(boardId, gameType, totalQuestions);
      setActiveIcebreaker(session);
      if (onShowToast) {
        onShowToast(`Icebreaker "${session.title}" dimulai (${totalQuestions} soal)!`);
      }
    } catch (err) {
      console.error('Gagal memulai icebreaker:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal memulai icebreaker');
    }
  };

  // Handler: Submit Icebreaker Vote
  const handleVoteIcebreaker = async (optionId) => {
    try {
      await api.submitIcebreakerVote(boardId, optionId);
    } catch (err) {
      console.error('Gagal kirim vote icebreaker:', err);
    }
  };

  // Handler: Reveal Icebreaker Answer
  const handleRevealIcebreaker = async () => {
    try {
      const session = await api.revealIcebreaker(boardId);
      setActiveIcebreaker(session);
    } catch (err) {
      console.error('Gagal membuka jawaban icebreaker:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal membuka jawaban');
    }
  };

  // Handler: Skip Icebreaker Question
  const handleSkipIcebreaker = async () => {
    try {
      const session = await api.skipIcebreaker(boardId);
      setActiveIcebreaker(session);
    } catch (err) {
      console.error('Gagal skip icebreaker:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal skip icebreaker');
    }
  };

  // Handler: End Icebreaker Session
  const handleEndIcebreaker = async () => {
    try {
      await api.endIcebreaker(boardId);
      setActiveIcebreaker((prev) => (prev ? { ...prev, status: 'ended' } : null));
    } catch (err) {
      console.error('Gagal mengakhiri icebreaker:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal mengakhiri icebreaker');
    }
  };

  // ── Synchronize Presentation Mode if already active on board ──
  useEffect(() => {
    if (board?.presentationMode) {
      setIsPresentationOpen(true);
      if (board?.presentationCurrentCardId && cards.length > 0) {
        const found = cards.find((c) => c.id === board.presentationCurrentCardId);
        if (found) {
          setPresentationCard(found);
          const idx = cards.findIndex((c) => c.id === board.presentationCurrentCardId);
          setPresentationIndex(idx >= 0 ? idx : 0);
          setPresentationTotal(cards.length);
          setIsPresentationFirst(idx <= 0);
          setIsPresentationLast(idx >= cards.length - 1);
        }
      }
    }
  }, [board?.presentationMode, board?.presentationCurrentCardId, cards]);

  // ── Presentation Mode Handlers ──
  const handleTogglePresentationOverlay = async () => {
    if (isPresentationOpen) {
      setIsPresentationOpen(true);
      return;
    }

    if (!isFacilitator) {
      if (board?.presentationMode || presentationCard) {
        setIsPresentationOpen(true);
      } else {
        if (onShowToast) onShowToast('Mode presentasi belum dimulai oleh fasilitator');
      }
      return;
    }

    // Facilitator starts presentation
    try {
      setIsNavigatingPresentation(true);
      const res = await api.startPresentation(boardId);
      if (res?.card) {
        setPresentationCard(res.card);
        setPresentationIndex(res.currentIndex ?? 0);
        setPresentationTotal(res.totalCards ?? 1);
        setIsPresentationFirst(Boolean(res.isFirst));
        setIsPresentationLast(Boolean(res.isLast));
      }
      setIsPresentationOpen(true);
      if (onShowToast) onShowToast('Mode presentasi berhasil diaktifkan');
    } catch (err) {
      console.error('Gagal memulai mode presentasi:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal memulai mode presentasi');
    } finally {
      setIsNavigatingPresentation(false);
    }
  };

  const handleNextPresentation = async () => {
    if (!isFacilitator || isNavigatingPresentation) return;
    try {
      setIsNavigatingPresentation(true);
      const res = await api.nextPresentation(boardId);
      if (res?.card) {
        setPresentationCard(res.card);
        setPresentationIndex(res.currentIndex ?? 0);
        setPresentationTotal(res.totalCards ?? 1);
        setIsPresentationFirst(Boolean(res.isFirst));
        setIsPresentationLast(Boolean(res.isLast));
      }
    } catch (err) {
      console.error('Gagal navigasi next presentation:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal beralih ke card berikutnya');
    } finally {
      setIsNavigatingPresentation(false);
    }
  };

  const handlePrevPresentation = async () => {
    if (!isFacilitator || isNavigatingPresentation) return;
    try {
      setIsNavigatingPresentation(true);
      const res = await api.prevPresentation(boardId);
      if (res?.card) {
        setPresentationCard(res.card);
        setPresentationIndex(res.currentIndex ?? 0);
        setPresentationTotal(res.totalCards ?? 1);
        setIsPresentationFirst(Boolean(res.isFirst));
        setIsPresentationLast(Boolean(res.isLast));
      }
    } catch (err) {
      console.error('Gagal navigasi prev presentation:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal beralih ke card sebelumnya');
    } finally {
      setIsNavigatingPresentation(false);
    }
  };

  const handleStopPresentation = async () => {
    if (!isFacilitator) return;
    try {
      await api.stopPresentation(boardId);
      setIsPresentationOpen(false);
      setPresentationCard(null);
      if (onShowToast) onShowToast('Mode presentasi berhasil dihentikan');
    } catch (err) {
      console.error('Gagal menghentikan mode presentasi:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal menghentikan mode presentasi');
    }
  };

  // ── Handlers: Complete / Reopen Board Sesi ──
  const handleCompleteBoard = async () => {
    try {
      await api.updateBoardStatus(boardId, 'selesai');
      setBoardStatus('selesai');
      setIsReadOnly(true);
      setShowCompleteModal(false);
      if (onShowToast) onShowToast('Sesi retrospective berhasil diselesaikan & dikunci (Mode Baca)');
      if (onUpdateBoard) {
        onUpdateBoard({ id: boardId, status: 'selesai' });
      }
    } catch (err) {
      console.error('Gagal menyelesaikan board:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal menyelesaikan board');
    }
  };

  const handleReopenBoard = async () => {
    try {
      await api.updateBoardStatus(boardId, 'aktif');
      setBoardStatus('aktif');
      setIsReadOnly(false);
      if (onShowToast) onShowToast('Sesi retrospective dibuka kembali untuk pengeditan');
      if (onUpdateBoard) {
        onUpdateBoard({ id: boardId, status: 'aktif' });
      }
    } catch (err) {
      console.error('Gagal membuka kembali board:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal membuka kembali board');
    }
  };

  // Handler: Toggle Personal Anonymous Mode
  const handleToggleMyAnonymous = () => {
    const nextState = !isMyAnonymous;
    setIsMyAnonymous(nextState);
    try {
      localStorage.setItem(
        `retro_anon_${boardId}_${currentUser?.id || currentUser?.email || 'user'}`,
        String(nextState)
      );
    } catch {}

    if (onShowToast) {
      if (nextState) {
        onShowToast('Mode Anonymous aktif untuk Anda. Catatan yang Anda buat akan bersifat anonim.');
      } else {
        onShowToast('Mode Anonymous dinonaktifkan. Catatan Anda akan menampilkan nama Anda.');
      }
    }
  };

  // Handler: Save Board Settings & Anonymous Mode
  const handleSaveBoardSettings = async ({ boardName: newName, isAnonymous: newAnon }) => {
    const hasAnonChanged = newAnon !== isAnonymous;
    const hasNameChanged = Boolean(newName && newName !== currentBoardTitle);

    if (hasNameChanged) {
      setCurrentBoardTitle(newName);
    }

    if (hasAnonChanged) {
      setIsAnonymous(newAnon);
      setIsMyAnonymous(newAnon);
      try {
        localStorage.setItem(
          `retro_anon_${boardId}_${currentUser?.id || currentUser?.email || 'user'}`,
          String(newAnon)
        );
      } catch {}
      try {
        await api.updateAnonymous(boardId, newAnon);
        if (onShowToast) {
          onShowToast(`Mode anonymous berhasil ${newAnon ? 'diaktifkan' : 'dinonaktifkan'}`);
        }
      } catch (err) {
        console.warn('Gagal update mode anonymous di server:', err);
        if (onShowToast) {
          onShowToast(err.message || 'Mode anonymous diperbarui');
        }
      }
    } else if (hasNameChanged) {
      if (onShowToast) {
        onShowToast('Pengaturan board berhasil disimpan');
      }
    }

    if (onUpdateBoard) {
      onUpdateBoard({
        id: boardId,
        name: newName || currentBoardTitle,
        title: newName || currentBoardTitle,
        isAnonymous: newAnon,
      });
    }
  };

  // ── Handler: Reveal Cards ──
  // Panggil endpoint backend POST /api/boards/:id/reveal,
  // ubah state isPrivateMode → false dan isRevealed → true,
  // lalu tampilkan banner sukses selama 5 detik.
  const handleRevealCards = useCallback(async () => {
    try {
      if (boardId) {
        await api.revealBoard(boardId);
      }
      setIsPrivateMode(false);
      setIsRevealed(true);
      setShowRevealedBanner(true);
      if (onShowToast) onShowToast('Semua card berhasil di-reveal ke seluruh anggota tim!');
      setTimeout(() => setShowRevealedBanner(false), 5000);
      loadCardsFromApi();
    } catch (err) {
      console.error('Gagal reveal card di server:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal me-reveal kartu');
    }
  }, [boardId, onShowToast, loadCardsFromApi]);

  // Sensor drag dengan activation constraint agar tidak mengganggu klik vote/menu
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Calculate highest voted card for dynamic priority
  const maxVotes = useMemo(() => {
    if (!cards.length) return 0;
    return Math.max(
      ...cards.map((c) => {
        if (typeof c.votesCount === 'number') return c.votesCount;
        if (Array.isArray(c.votes)) return c.votes.length;
        if (typeof c.votes === 'number') return c.votes;
        return c.voteCount || 0;
      })
    );
  }, [cards]);

  // Handler: Toggle Read-Only Mode
  const handleToggleReadOnly = () => {
    const nextState = !isReadOnly;
    setIsReadOnly(nextState);
    try {
      const url = new URL(window.location.href);
      if (nextState) {
        url.searchParams.set('readOnly', 'true');
      } else {
        url.searchParams.delete('readOnly');
      }
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch {}
    if (onShowToast) {
      onShowToast(
        nextState
          ? 'Mode Baca Saja (Read-Only) aktif'
          : 'Mode Interaktif (Edit) aktif'
      );
    }
  };

  // Handler: Share Board Link (Interactive or Read-Only)
  const handleCopyBoardLink = (asReadOnly = false) => {
    const origin = window.location.origin;
    const targetBoardId = board?.id || boardId;
    const url = asReadOnly
      ? `${origin}/board/${targetBoardId}?readOnly=true`
      : `${origin}/board/${targetBoardId}`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setIsShareMenuOpen(false);
    if (onShowToast) {
      onShowToast(
        asReadOnly
          ? 'Link Mode Baca Saja (Read-Only) berhasil disalin!'
          : 'Link Board Retrospective berhasil disalin!'
      );
    }
  };

  // Handler: Export Retro Board to PDF
  const handleExportPdf = async () => {
    if (!board?.id || isExporting) return;
    setIsExporting(true);
    try {
      const { blob, filename } = await api.exportBoardPdf(board.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `Retro_${board.name || 'Board'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      if (onShowToast) onShowToast('Hasil retrospective berhasil diekspor ke PDF!');
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal mengekspor PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Handler: Add Card
  const handleAddCard = async (columnId, text) => {
    const defaultAvatar =
      currentUser?.avatarUrl ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email || 'user'}`;
    const authorName =
      currentUser?.name ||
      currentUser?.fullName?.replace(' (Anda)', '') ||
      currentUser?.email?.split('@')[0] ||
      'Anda';

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const isCardAnon = Boolean(isAnonymous || isMyAnonymous);
    const tempId = `card_${Date.now()}`;
    const newCard = {
      id: tempId,
      columnId,
      content: text,
      author: {
        id: currentUser?.id || 'current_user',
        name: authorName,
        email: currentUser?.email || '',
      },
      isOwner: true,
      isAnonymous: isCardAnon,
      authorName,
      avatar: defaultAvatar,
      time: formattedTime,
      createdAt: now.toISOString(),
      votes: [],
      votesCount: 0,
      votedBy: [],
      hasVoted: false,
      comments: [],
      commentsCount: 0,
      commentCount: 0,
    };

    setCards((prev) => [...prev, newCard]);
    if (onShowToast) onShowToast('Catatan berhasil ditambahkan!');

    // Async sync with API
    try {
      const res = await api.createCard(boardId, columnId, text, isCardAnon);
      if (res?.card) {
        const realCardId = res.card.id;
        setCards((prev) => {
          // Jika Pusher sudah menyisipkan kartu ini, cukup buang kartu temporary
          const alreadyExists = prev.some((c) => c.id === realCardId);
          if (alreadyExists) {
            return prev.filter((c) => c.id !== tempId);
          }
          return prev.map((c) =>
            c.id === tempId
              ? {
                  ...c,
                  ...res.card,
                  id: realCardId,
                  text: res.card.content || c.text,
                  columnId: res.card.columnId || c.columnId,
                }
              : c
          );
        });
      }
    } catch (err) {
      console.error('[API Error] Gagal menambahkan card:', err);
      // Hapus temporary card agar state sinkron dengan database
      setCards((prev) => prev.filter((c) => c.id !== tempId));
      if (onShowToast) {
        onShowToast(`Gagal menambahkan catatan: ${err.message || 'Server error'}`);
      }
    }
  };

  // Handler: Edit Card
  const handleEditCard = async (cardId, updatedText) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, content: updatedText, text: updatedText } : c
      )
    );
    setSelectedCardForDetail((prev) =>
      prev && prev.id === cardId ? { ...prev, content: updatedText, text: updatedText } : prev
    );
    if (onShowToast) onShowToast('Catatan berhasil diperbarui!');

    try {
      await api.updateCard(cardId, updatedText);
    } catch {
      // Local state updated
    }
  };

  // Handler: Delete Card
  const handleDeleteCard = async (card) => {
    setCards((prev) => prev.filter((c) => c.id !== card.id));
    setSelectedCardForDetail((prev) => (prev && prev.id === card.id ? null : prev));
    if (onShowToast) onShowToast('Catatan berhasil dihapus');

    try {
      await api.deleteCard(card.id);
    } catch {
      // Local state updated
    }
  };

  // Handler: Toggle Vote on Card
  const handleVoteCard = async (cardId) => {
    const currentUserId = currentUser?.id || currentUser?.email || 'current_user';
    let userHasVoted = false;

    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const currentVotes = Array.isArray(c.votes) ? [...c.votes] : [];
          userHasVoted =
            Boolean(c.hasVoted) ||
            currentVotes.some((v) => (v.userId || v.id || v) === currentUserId);

          let updatedVotes;
          if (userHasVoted) {
            updatedVotes = currentVotes.filter(
              (v) => (v.userId || v.id || v) !== currentUserId
            );
            if (onShowToast) onShowToast('Vote dibatalkan');
          } else {
            updatedVotes = [
              ...currentVotes,
              { userId: currentUserId, votedAt: new Date().toISOString() },
            ];
            if (onShowToast) onShowToast('Vote berhasil ditambahkan! (+1)');
          }

          return {
            ...c,
            votes: updatedVotes,
            votesCount: updatedVotes.length,
            hasVoted: !userHasVoted,
          };
        }
        return c;
      })
    );

    setSelectedCardForDetail((prev) => {
      if (prev && prev.id === cardId) {
        const currentVotes = Array.isArray(prev.votes) ? [...prev.votes] : [];
        const isVoted =
          Boolean(prev.hasVoted) ||
          currentVotes.some((v) => (v.userId || v.id || v) === currentUserId);

        let updatedVotes;
        if (isVoted) {
          updatedVotes = currentVotes.filter(
            (v) => (v.userId || v.id || v) !== currentUserId
          );
        } else {
          updatedVotes = [
            ...currentVotes,
            { userId: currentUserId, votedAt: new Date().toISOString() },
          ];
        }

        return {
          ...prev,
          votes: updatedVotes,
          votesCount: updatedVotes.length,
          hasVoted: !isVoted,
        };
      }
      return prev;
    });

    try {
      if (userHasVoted) {
        await api.unvoteCard(cardId);
      } else {
        await api.voteCard(cardId);
      }
    } catch (err) {
      console.error('Failed to vote/unvote card:', err);
    }
  };

  // Handler: Add Comment to Card
  const handleAddComment = async (cardId, text) => {
    const defaultAvatar =
      currentUser?.avatarUrl ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email || 'afrizal'}`;
    const authorName =
      currentUser?.name ||
      currentUser?.fullName?.replace(' (Anda)', '') ||
      currentUser?.email?.split('@')[0] ||
      'Afrizal';

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const newCommentId = `comment_${Date.now()}`;
    const newComment = {
      id: newCommentId,
      cardId,
      author: {
        id: currentUser?.id || 'current_user',
        name: authorName,
        email: currentUser?.email || '',
        avatarUrl: defaultAvatar,
      },
      authorName,
      avatar: defaultAvatar,
      text,
      time: formattedTime,
      createdAt: now.toISOString(),
      isHighlighted: true,
    };

    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const prevComments = Array.isArray(c.comments) ? c.comments : [];
          const nextComments = [...prevComments, newComment];
          return {
            ...c,
            comments: nextComments,
            commentCount: nextComments.length,
            commentsCount: nextComments.length,
          };
        }
        return c;
      })
    );

    setSelectedCardForDetail((prev) => {
      if (prev && prev.id === cardId) {
        const prevComments = Array.isArray(prev.comments) ? prev.comments : [];
        const nextComments = [...prevComments, newComment];
        return {
          ...prev,
          comments: nextComments,
          commentCount: nextComments.length,
          commentsCount: nextComments.length,
        };
      }
      return prev;
    });

    if (onShowToast) onShowToast('Komentar berhasil ditambahkan!');

    try {
      const res = await api.addComment(cardId, text);
      const serverComment = res?.comment;
      if (serverComment?.id) {
        setCards((prev) =>
          prev.map((c) => {
            if (c.id === cardId && Array.isArray(c.comments)) {
              return {
                ...c,
                comments: c.comments.map((cm) =>
                  cm.id === newCommentId ? { ...cm, id: serverComment.id } : cm
                ),
              };
            }
            return c;
          })
        );
        setSelectedCardForDetail((prev) => {
          if (prev && prev.id === cardId && Array.isArray(prev.comments)) {
            return {
              ...prev,
              comments: prev.comments.map((cm) =>
                cm.id === newCommentId ? { ...cm, id: serverComment.id } : cm
              ),
            };
          }
          return prev;
        });
      }
    } catch {
      // Local state already updated
    }

    return newCommentId;
  };

  // Handler: Edit Comment
  const handleEditComment = async (cardId, commentId, newText) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId && Array.isArray(c.comments)) {
          return {
            ...c,
            comments: c.comments.map((cm) =>
              cm.id === commentId ? { ...cm, text: newText, content: newText } : cm
            ),
          };
        }
        return c;
      })
    );

    setSelectedCardForDetail((prev) => {
      if (prev && prev.id === cardId && Array.isArray(prev.comments)) {
        return {
          ...prev,
          comments: prev.comments.map((cm) =>
            cm.id === commentId ? { ...cm, text: newText, content: newText } : cm
          ),
        };
      }
      return prev;
    });

    if (onShowToast) onShowToast('Komentar berhasil diperbarui');
  };

  // Handler: Delete Comment
  const handleDeleteComment = async (cardId, commentId) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId && Array.isArray(c.comments)) {
          const nextComments = c.comments.filter((cm) => cm.id !== commentId);
          return {
            ...c,
            comments: nextComments,
            commentCount: nextComments.length,
            commentsCount: nextComments.length,
          };
        }
        return c;
      })
    );

    setSelectedCardForDetail((prev) => {
      if (prev && prev.id === cardId && Array.isArray(prev.comments)) {
        const nextComments = prev.comments.filter((cm) => cm.id !== commentId);
        return {
          ...prev,
          comments: nextComments,
          commentCount: nextComments.length,
          commentsCount: nextComments.length,
        };
      }
      return prev;
    });

    if (onShowToast) onShowToast('Komentar berhasil dihapus');
  };

  // Handler: Copy Card
  const handleCopyCard = () => {
    if (onShowToast) onShowToast('Teks catatan berhasil disalin!');
  };

  // Handler: Drag & Drop Card Grouping & Moving
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || !active) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // A. Dragging Entire Group Cluster
    if (activeData?.type === 'group' && activeData?.groupId) {
      if (overData?.type === 'column' && overData?.columnId !== activeData.columnId) {
        handleMoveGroupColumn(activeData.groupId, overData.columnId);
      }
      return;
    }

    // B. Dragging Individual Card
    if (!activeData?.card) return;
    const activeCard = activeData.card;

    // 1. Dropped on another card
    if (overData?.type === 'card' && overData?.card) {
      const targetCard = overData.card;
      if (activeCard.id === targetCard.id) return;

      const targetGroupId = targetCard.groupId || activeCard.groupId || `group_${Date.now()}`;
      const targetColumnId = targetCard.columnId || activeCard.columnId;

      setCards((prev) =>
        prev.map((c) => {
          if (c.id === activeCard.id) {
            return { ...c, groupId: targetGroupId, columnId: targetColumnId };
          }
          if (c.id === targetCard.id) {
            return { ...c, groupId: targetGroupId };
          }
          return c;
        })
      );

      if (onShowToast) onShowToast('Catatan digabungkan ke dalam grup');

      try {
        if (activeCard.columnId !== targetColumnId) {
          await api.moveCard(activeCard.id, targetColumnId);
        }
        await api.groupCard(activeCard.id, targetGroupId);
        if (!targetCard.groupId) {
          await api.groupCard(targetCard.id, targetGroupId);
        }
      } catch (err) {
        console.error('Failed to group cards:', err);
      }
      return;
    }

    // 2. Dropped on existing group container
    if (overData?.type === 'group' && overData?.groupId) {
      const targetGroupId = overData.groupId;
      const targetColumnId = overData.columnId || activeCard.columnId;
      if (activeCard.groupId === targetGroupId && activeCard.columnId === targetColumnId) return;

      setCards((prev) =>
        prev.map((c) =>
          c.id === activeCard.id
            ? { ...c, groupId: targetGroupId, columnId: targetColumnId }
            : c
        )
      );

      if (onShowToast) onShowToast('Catatan ditambahkan ke grup');

      try {
        if (activeCard.columnId !== targetColumnId) {
          await api.moveCard(activeCard.id, targetColumnId);
        }
        await api.groupCard(activeCard.id, targetGroupId);
      } catch (err) {
        console.error('Failed to add card to group:', err);
      }
      return;
    }

    // 3. Dropped on column container (cross-column move or ungroup)
    if (overData?.type === 'column') {
      const targetColumnId = overData.columnId;
      if (targetColumnId && targetColumnId !== activeCard.columnId) {
        // Pindah ke kolom lain
        handleMoveCardColumn(activeCard.id, targetColumnId);
      } else if (activeCard.groupId) {
        // Drop di kolom yang sama untuk keluar dari grup
        handleUngroupCard(activeCard.id);
      }
    }
  };

  // Handler: Move Card to Another Column
  const handleMoveCardColumn = async (cardId, targetColumnId) => {
    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard || targetCard.columnId === targetColumnId) return;

    const oldGroupId = targetCard.groupId;

    setCards((prev) => {
      const remainingInGroup = oldGroupId
        ? prev.filter((c) => c.groupId === oldGroupId && c.id !== cardId)
        : [];

      return prev.map((c) => {
        if (c.id === cardId) {
          return { ...c, columnId: targetColumnId, groupId: null };
        }
        if (remainingInGroup.length === 1 && c.groupId === oldGroupId) {
          return { ...c, groupId: null };
        }
        return c;
      });
    });

    const targetColName =
      activeColumns.find((col) => col.id === targetColumnId || col.type === targetColumnId)
        ?.title || targetColumnId.toUpperCase();
    if (onShowToast) onShowToast(`Catatan dipindahkan ke kolom ${targetColName}`);

    try {
      await api.moveCard(cardId, targetColumnId);
      if (oldGroupId) {
        const remainingInGroup = cards.filter(
          (c) => c.groupId === oldGroupId && c.id !== cardId
        );
        if (remainingInGroup.length === 1) {
          await api.groupCard(remainingInGroup[0].id, null);
        }
      }
    } catch (err) {
      console.error('Failed to move card column:', err);
    }
  };

  // Handler: Ungroup Individual Card
  const handleUngroupCard = async (cardId) => {
    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard || !targetCard.groupId) return;

    const oldGroupId = targetCard.groupId;

    // Optimistically remove groupId from this card
    setCards((prev) => {
      const remainingInGroup = prev.filter(
        (c) => c.groupId === oldGroupId && c.id !== cardId
      );

      return prev.map((c) => {
        if (c.id === cardId) {
          return { ...c, groupId: null };
        }
        if (remainingInGroup.length === 1 && c.groupId === oldGroupId) {
          return { ...c, groupId: null };
        }
        return c;
      });
    });

    if (onShowToast) onShowToast('Catatan dikeluarkan dari grup');

    try {
      await api.groupCard(cardId, null);
      const remainingInGroup = cards.filter(
        (c) => c.groupId === oldGroupId && c.id !== cardId
      );
      if (remainingInGroup.length === 1) {
        await api.groupCard(remainingInGroup[0].id, null);
      }
    } catch (err) {
      console.error('Failed to ungroup card:', err);
    }
  };

  // Handler: Ungroup All Cards in a Group
  const handleUngroupAll = async (groupId) => {
    const cardsInGroup = cards.filter((c) => c.groupId === groupId);
    if (cardsInGroup.length === 0) return;

    setCards((prev) =>
      prev.map((c) => (c.groupId === groupId ? { ...c, groupId: null } : c))
    );

    if (onShowToast) onShowToast('Semua catatan dalam grup telah dipisahkan');

    try {
      await Promise.all(cardsInGroup.map((c) => api.groupCard(c.id, null)));
    } catch (err) {
      console.error('Failed to ungroup all cards:', err);
    }
  };

  // Handler: Rename Group Title
  const handleRenameGroup = async (groupId, newTitle) => {
    setCards((prev) =>
      prev.map((c) => (c.groupId === groupId ? { ...c, groupTitle: newTitle } : c))
    );

    if (onShowToast) onShowToast(`Nama grup diubah menjadi "${newTitle || 'Cluster'}"`);

    const groupCards = cards.filter((c) => c.groupId === groupId);
    if (groupCards.length > 0) {
      try {
        await api.groupCard(groupCards[0].id, groupId, newTitle);
      } catch (err) {
        console.error('Failed to rename group:', err);
      }
    }
  };

  // Handler: Convert Card to Action Item
  const handleConvertToActionItem = (card) => {
    setConvertModalCard(card);
  };

  const handleConfirmConvert = async ({ card, assignee, dueDate, status = 'PENDING', description }) => {
    const dueDateDisplay = dueDate
      ? new Date(dueDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

    const optimisticItem = {
      id: `ai_${Date.now()}`,
      cardId: card.id,
      title: card.content || card.text || 'Action Item',
      assignee: assignee || null,
      dueDate,
      dueDateDisplay,
      description: description || '',
      status: status || 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setActionItems((prev) => {
      // Prevent duplicates: replace if card already converted
      const existingIdx = prev.findIndex((ai) => ai.cardId === card.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = optimisticItem;
        return updated;
      }
      return [optimisticItem, ...prev];
    });

    setConvertModalCard(null);
    setActiveTab('action-items');
    if (onShowToast) onShowToast('Kartu berhasil dikonversi menjadi Action Item!');

    try {
      const isRealUuid =
        assignee?.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignee.id);

      const payload = {
        title: card.content || card.text || 'Action Item',
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: status || 'PENDING',
        ...(isRealUuid ? { assigneeId: assignee.id } : {}),
      };

      const res = await api.convertCardToAction(card.id, payload);
      if (res?.actionItem) {
        const formatted = formatActionItem(res.actionItem);
        setActionItems((prev) =>
          prev.map((ai) =>
            ai.cardId === card.id || ai.id === optimisticItem.id ? formatted : ai
          )
        );
      }
    } catch (err) {
      console.error('Gagal konversi ke action item:', err);
    }
  };

  // Handler: Change Action Item Status
  const handleChangeActionItemStatus = async (itemId, newStatus) => {
    setActionItems((prev) =>
      prev.map((ai) => (ai.id === itemId ? { ...ai, status: newStatus } : ai))
    );
    if (onShowToast) onShowToast(`Status diubah menjadi ${newStatus}`);

    try {
      await api.updateActionItem(itemId, { status: newStatus });
    } catch (err) {
      console.error('Gagal update status action item:', err);
    }
  };

  // Handler: Change Action Item Due Date
  const handleUpdateActionItemDueDate = async (itemId, newDueDate) => {
    let formattedDisplay = '–';
    if (newDueDate) {
      const d = new Date(newDueDate);
      if (!isNaN(d.getTime())) {
        formattedDisplay = d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    }
    setActionItems((prev) =>
      prev.map((ai) =>
        ai.id === itemId
          ? {
              ...ai,
              dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
              dueDateDisplay: formattedDisplay,
            }
          : ai
      )
    );
    if (onShowToast) onShowToast('Tenggat waktu (due date) diperbarui');

    try {
      await api.updateActionItem(itemId, {
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
      });
    } catch (err) {
      console.error('Gagal update due date action item:', err);
      if (onShowToast) onShowToast('Gagal memperbarui due date');
    }
  };

  // Handler: Delete Action Item
  const handleDeleteActionItem = (itemId) => {
    setActionItems((prev) => prev.filter((ai) => ai.id !== itemId));
    if (onShowToast) onShowToast('Action item berhasil dihapus');
  };

  // Handler: Move Entire Group Cluster to Another Column
  const handleMoveGroupColumn = async (groupId, targetColumnId) => {
    const groupCards = cards.filter((c) => c.groupId === groupId);
    if (groupCards.length === 0) return;

    setCards((prev) =>
      prev.map((c) => (c.groupId === groupId ? { ...c, columnId: targetColumnId } : c))
    );

    const targetColName =
      activeColumns.find((col) => col.id === targetColumnId || col.type === targetColumnId)
        ?.title || targetColumnId.toUpperCase();
    const groupTitle = groupCards[0]?.groupTitle || 'Cluster';
    if (onShowToast)
      onShowToast(`Seluruh grup "${groupTitle}" dipindahkan ke kolom ${targetColName}`);

    try {
      await Promise.all(
        groupCards.map((c) => api.moveCard(c.id, targetColumnId))
      );
    } catch (err) {
      console.error('Failed to move group column:', err);
    }
  };

  const boardTitle = currentBoardTitle || board?.title || board?.name || 'Sprint 16 Retrospective';
  const wsName = workspace?.name || 'Mobile Team';
  const memberCount = members.length > 0 ? members.length : workspace?.memberCount || board?.membersCount || 1;
  const totalMemberCount = memberCount;
  const dateText = board?.dateText || 'Dibuat 30 Jun 2026';

  // Daftar anggota yang ditampilkan (prioritas anggota online, fallback ke member workspace)
  const displayMembers = useMemo(() => {
    if (onlineMembers && onlineMembers.length > 0) {
      return onlineMembers;
    }
    if (members && members.length > 0) {
      return members;
    }
    const myEmail = currentUser?.email || '';
    const myName = currentUser?.name || currentUser?.fullName || (myEmail ? myEmail.split('@')[0] : 'Anda');
    return [
      {
        id: currentUser?.id || 'current_user',
        name: myName,
        email: myEmail,
        avatarUrl: currentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myEmail || myName}`,
      },
    ];
  }, [onlineMembers, members, currentUser]);

  // Resolve retro columns dynamically based on board template
  const rawTemplate = (board?.template || 'start-stop-continue')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
  const templateCols =
    TEMPLATE_COLUMNS_MAP[rawTemplate] ||
    (rawTemplate.includes('mad') ||
    rawTemplate.includes('sad') ||
    rawTemplate.includes('glad')
      ? TEMPLATE_COLUMNS_MAP['mad-sad-glad']
      : rawTemplate.includes('4l') ||
        rawTemplate.includes('liked') ||
        rawTemplate.includes('learned')
      ? TEMPLATE_COLUMNS_MAP['4ls']
      : rawTemplate.includes('went') ||
        rawTemplate.includes('wrong') ||
        rawTemplate.includes('well')
      ? TEMPLATE_COLUMNS_MAP['went-well-wrong']
      : TEMPLATE_COLUMNS_MAP['start-stop-continue']);

  const columnsSource =
    boardColumns && boardColumns.length > 0
      ? boardColumns
      : board?.columns && board.columns.length > 0
      ? board.columns
      : null;

  const activeColumns = useMemo(() => {
    let cols = [];
    if (columnsSource && columnsSource.length > 0) {
      cols = columnsSource.map((bc, idx) => {
        const matched =
          templateCols.find(
            (tc) =>
              tc?.name?.toLowerCase() === bc?.name?.toLowerCase() ||
              tc?.id?.toLowerCase() === bc?.name?.toLowerCase() ||
              tc?.type?.toLowerCase() === bc?.name?.toLowerCase()
          ) ||
          templateCols[idx % templateCols.length] ||
          {};
        return {
          ...matched,
          id: bc.id,
          dbId: bc.id,
          templateId: matched.id || bc.name?.toLowerCase(),
          name: bc.name || matched.name,
          title: bc.name?.toUpperCase() || matched.title,
          type: matched.type || bc.name?.toLowerCase(),
        };
      });
    } else {
      cols = [...templateCols];
    }

    // Pastikan kolom ACTION ITEMS selalu hadir di canvas board retro
    const hasActionCol = cols.some(
      (c) =>
        c.name?.toLowerCase().includes('action') ||
        c.title?.toLowerCase().includes('action') ||
        c.id?.toLowerCase().includes('action') ||
        c.templateId?.toLowerCase().includes('action')
    );
    if (!hasActionCol) {
      cols.push({
        id: 'action_items',
        dbId: 'action_items',
        type: 'continue',
        templateId: 'action_items',
        title: 'ACTION ITEMS',
        name: 'ACTION ITEMS',
        color: '#2563eb',
        bg: '#eff6ff',
        border: '#bfdbfe',
        badgeBg: '#dbeafe',
        badgeColor: '#2563eb',
      });
    }

    return cols;
  }, [columnsSource, templateCols]);

  return (
    <div className="retro-board-full-view">
      {/* ── Top Breadcrumb Bar ── */}
      <div className="retro-full-topbar">
        <div className="retro-full-breadcrumbs">
          <button type="button" className="retro-crumb-btn" onClick={onNavigateAllWorkspaces || onBack}>
            Workspace Saya
          </button>
          <span className="retro-crumb-chevron">{'>'}</span>
          <button type="button" className="retro-crumb-btn" onClick={onBack}>
            {wsName}
          </button>
          <span className="retro-crumb-chevron">{'>'}</span>

          {workspace?.boards && workspace.boards.length > 1 ? (
            <div
              className="retro-board-switcher-container"
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <button
                type="button"
                className="retro-crumb-active-btn"
                onClick={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: '13px',
                }}
              >
                <span>{boardTitle}</span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {isBoardDropdownOpen && (
                <div
                  className="retro-board-dropdown-popup"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '6px',
                    backgroundColor: '#ffffff',
                    boxShadow:
                      '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    padding: '6px',
                    zIndex: 50,
                    minWidth: '220px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                    }}
                  >
                    Pindah Board di {wsName}
                  </div>
                  {(workspace?.boards || []).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setIsBoardDropdownOpen(false);
                        if (onSwitchBoard) onSwitchBoard(b);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '13px',
                        color: b.id === board?.id ? '#5956e9' : '#334155',
                        fontWeight: b.id === board?.id ? 600 : 400,
                        backgroundColor:
                          b.id === board?.id ? '#f1f5f9' : 'transparent',
                        borderRadius: '6px',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{b.title || b.name}</span>
                      {b.id === board?.id && <Check size={14} color="#5956e9" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="retro-crumb-active">{boardTitle}</span>
          )}
        </div>

        {/* Top right icons (grid, bell, avatar) */}
        <div className="retro-full-topbar-right">
          <button type="button" className="btn-icon-top" title="Tampilan">
            <LayoutGrid size={18} />
          </button>
          <NotificationBell
            workspaceId={board?.workspaceId || board?.workspace?.id || workspace?.id}
            currentUser={currentUser}
            onShowToast={onShowToast}
            onNavigateActionItems={() => setActiveTab('action-items')}
          />

          {onToggleDarkMode && (
            <button
              type="button"
              className="btn-icon-top"
              title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              onClick={onToggleDarkMode}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          <div className="top-user-avatar-wrapper">
            <img
              src={
                currentUser?.avatarUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=user`
              }
              alt={currentUser?.name || 'User'}
              className="top-user-avatar"
            />
          </div>
        </div>
      </div>

      {/* ── Board Header Banner ── */}
      <div className="retro-board-header-banner">
        <div className="retro-board-header-left">
          {/* 4-dot squircle icon */}
          <div
            className="retro-board-icon-box"
            style={{ backgroundColor: '#f3f0ff' }}
          >
            <div className="four-dots-icon" style={{ '--dot-color': '#5956e9' }}>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <div className="retro-board-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="retro-board-header-title">{boardTitle}</h1>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsEditBoardModalOpen(true)}
                  title="Ubah Nama Board"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#5956e9';
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Edit size={16} />
                </button>
              )}
            </div>
            <div className="retro-board-header-meta">
              <span className="retro-meta-ws">{wsName}</span>
              <span className="retro-meta-sep">·</span>
              <User size={14} className="retro-meta-icon" />
              <span className="retro-meta-members">{memberCount} anggota</span>
              <span className="retro-meta-sep">·</span>
              <Clock size={14} className="retro-meta-icon" />
              <span className="retro-meta-date">{dateText}</span>
              {isReadOnly && (
                <>
                  <span className="retro-meta-sep">·</span>
                  <span className="retro-readonly-badge" title="Mode Baca Saja Aktif">
                    <Eye size={12} />
                    <span>Mode Baca Saja</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="retro-board-header-right">
          {/* Online status indicator badge (Realtime Count) */}
          <div className="retro-online-badge">
            <span className="retro-online-dot"></span>
            <span>{onlineCount} online</span>
          </div>

          {/* Real member avatars stack */}
          <div className="retro-avatars-stack" title={`${onlineCount} anggota online`}>
            {displayMembers.slice(0, 3).map((m, idx) => (
              <img
                key={m.id || idx}
                src={getUserAvatar(m, m.name || m.email || idx)}
                alt={m.name || 'Member'}
                title={m.name || m.email || 'Member'}
                className="retro-stack-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getUserAvatar(m, m.name || 'user');
                }}
              />
            ))}
            {displayMembers.length > 3 && (
              <div className="retro-stack-more" title={`${displayMembers.length - 3} lainnya`}>
                +{displayMembers.length - 3}
              </div>
            )}
          </div>

          {/* Status Selesai Badge & Reopen Button */}
          {boardStatus === 'selesai' ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                <Lock size={13} />
                <span>Selesai (Read-Only)</span>
              </div>

              {isFacilitator && (
                <button
                  type="button"
                  onClick={handleReopenBoard}
                  title="Buka kembali sesi retrospective ini untuk pengeditan"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #6366f1',
                    backgroundColor: '#ffffff',
                    color: '#6366f1',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Buka Kembali</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Tombol Selesaikan Sesi untuk Fasilitator */}
              {isFacilitator && (
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(true)}
                  title="Selesaikan sesi retrospective dan kunci board"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #10b981',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle size={14} />
                  <span>Selesaikan Sesi</span>
                </button>
              )}

              {/* Toggle Read-Only Mode Button */}
              <button
                type="button"
                className={`btn-toggle-readonly ${isReadOnly ? 'active-readonly' : ''}`}
                onClick={handleToggleReadOnly}
                title={isReadOnly ? 'Beralih ke Mode Interaktif (Bisa Edit & Vote)' : 'Beralih ke Mode Baca Saja (Terkunci)'}
              >
                {isReadOnly ? <Edit size={14} /> : <Eye size={14} />}
                <span>{isReadOnly ? 'Mode Edit' : 'Mode Baca'}</span>
              </button>

              {!isReadOnly && (
                <button
                  type="button"
                  className="btn-ghost-icon"
                  title="Pengaturan board"
                  onClick={() => setIsSettingsModalOpen(true)}
                >
                  <MoreHorizontal size={18} />
                </button>
              )}
            </>
          )}

          {/* Share Dropdown Button */}
          <div className="retro-share-wrapper" ref={shareMenuRef}>
            <button
              type="button"
              className="btn-share-board"
              onClick={() => setIsShareMenuOpen((prev) => !prev)}
              title="Bagikan URL Board Retro"
            >
              <Share2 size={14} />
              <span>+ Bagikan Board</span>
            </button>

            {isShareMenuOpen && (
              <div className="retro-share-dropdown">
                <div className="retro-share-dropdown-header">
                  <div className="retro-share-title">Bagikan Board Retrospective</div>
                  <div className="retro-share-subtitle">Akses aman hanya untuk anggota workspace ini</div>
                </div>

                <div className="retro-share-options">
                  <button
                    type="button"
                    className="retro-share-option-btn"
                    onClick={() => handleCopyBoardLink(false)}
                  >
                    <div className="retro-share-opt-icon edit-icon">
                      <Link size={15} />
                    </div>
                    <div className="retro-share-opt-content">
                      <div className="retro-share-opt-title">Salin Link Board (Interaktif)</div>
                      <div className="retro-share-opt-desc">Bisa menambah kartu, vote, & berdiskusi</div>
                    </div>
                    <Copy size={13} className="retro-share-copy-indicator" />
                  </button>

                  <button
                    type="button"
                    className="retro-share-option-btn"
                    onClick={() => handleCopyBoardLink(true)}
                  >
                    <div className="retro-share-opt-icon readonly-icon">
                      <Eye size={15} />
                    </div>
                    <div className="retro-share-opt-content">
                      <div className="retro-share-opt-title">Salin Link Mode Baca Saja</div>
                      <div className="retro-share-opt-desc">Hanya melihat kartu tanpa opsi edit atau vote</div>
                    </div>
                    <Copy size={13} className="retro-share-copy-indicator" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs with Realtime Status Badge & Mulai Timer Button ── */}
      <div className="retro-board-tabs">
        <div className="retro-tabs-left">
          {BOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`retro-board-tab-btn ${
                activeTab === tab.id ? 'active' : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="retro-tabs-right">
          {/* ── Revealed indicator badge (setelah reveal) ── */}
          {!isReadOnly && isRevealed && (
            <div className="private-mode-waiting-badge" style={{ background: 'rgba(22,163,74,0.10)', borderColor: 'rgba(22,163,74,0.25)', color: '#16a34a' }}>
              <Unlock size={12} />
              Cards Revealed
            </div>
          )}

          {!isReadOnly && isFacilitator && (
            <button
              type="button"
              className="retro-icebreaker-btn"
              onClick={() => setIsIcebreakerSelectModalOpen(true)}
              title="Mulai Sesi Icebreaker"
            >
              <Gamepad2 size={16} />
              <span>Icebreaker</span>
            </button>
          )}

          {!isReadOnly && (
            <button
              type="button"
              className={`retro-mulai-timer-btn ${
                timerStatus === 'running' ? 'active-running' : ''
              }`}
              onClick={() => setIsTimerModalOpen(true)}
              title="Atur & Mulai Timer Sesi"
            >
              <AlarmClock size={16} />
              <span>Mulai Timer</span>
            </button>
          )}

          {/* ── Presentation Mode Button (Screenshot 1) ── */}
          <button
            type="button"
            className={`retro-presentation-btn ${isPresentationOpen ? 'active-presentation' : ''}`}
            onClick={handleTogglePresentationOverlay}
            title={isFacilitator ? "Mulai / Buka Mode Presentasi" : "Lihat Mode Presentasi"}
          >
            <Play size={13} fill={isPresentationOpen ? 'currentColor' : '#6366f1'} />
            <span>Presentation</span>
          </button>

          {/* ── PDF Export Button (Screenshot 1) ── */}
          <button
            type="button"
            className="btn-export-board"
            onClick={handleExportPdf}
            disabled={isExporting}
            title="Ekspor hasil retrospective ke file PDF"
          >
            {isExporting ? (
              <Loader2 size={14} className="btn-export-spinner" />
            ) : (
              <FileDown size={14} />
            )}
            <span>{isExporting ? 'Mengekspor...' : 'PDF'}</span>
          </button>

          {isReadOnly && (
            <div className="retro-readonly-tabs-hint">
              <Eye size={14} />
              <span>Mode Baca Saja</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Persistent Session Timer Banner (Running / Paused across ALL tabs: Board, Action Items, etc.) ── */}
      {['running', 'paused'].includes(timerStatus) && (
        <div className="retro-session-timer-banner-wrapper" style={{ padding: '20px 28px 0 28px' }}>
          <SessionTimerBanner
            status={timerStatus}
            remainingSeconds={timerRemaining}
            facilitator={timerFacilitator}
            isStarter={
              !timerStartedById ||
              timerStartedById === (currentUser?.id || currentUser?.userId) ||
              (timerFacilitator && (
                timerFacilitator.toLowerCase() === (currentUser?.name || '').toLowerCase() ||
                timerFacilitator.toLowerCase() === (currentUser?.email?.split('@')[0] || '').toLowerCase()
              ))
            }
            onPause={handlePauseTimer}
            onResume={handleResumeTimer}
            onReset={handleResetTimer}
          />
        </div>
      )}

      {/* ── Private Mode Banner (cards masih tersembunyi, menunggu reveal) ── */}
      {isPrivateMode && !isRevealed && !isReadOnly && activeTab === 'board' && (
        <div className="private-mode-banner">
          <div className="private-mode-banner-left">
            <div className="private-mode-banner-icon">
              <Lock size={15} color="#ffffff" strokeWidth={2.4} />
            </div>
            <div className="private-mode-banner-info">
              <span className="private-mode-tag">Mode Privat Aktif</span>
              <span className="private-mode-text-inline">
                {isFacilitator
                  ? 'Catatan tim masih tersembunyi agar opini independen. Klik Reveal jika siap berdiskusi.'
                  : 'Catatan Anda bersifat privat & hanya terlihat oleh Anda sampai sesi di-reveal.'}
              </span>
            </div>
          </div>
          <div className="private-mode-banner-right">
            <div className="private-mode-waiting-badge">
              <span className="private-mode-waiting-dot" />
              {isFacilitator ? 'Menunggu Anda Reveal' : 'Menunggu Reveal'}
            </div>
            {isFacilitator && (
              <button
                type="button"
                className="btn-reveal-cards-banner"
                onClick={() => setShowRevealModal(true)}
                title="Buka semua catatan tim sekarang"
              >
                <Eye size={14} />
                <span>Reveal Cards ({totalCardsCount > 0 ? totalCardsCount : cards.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Cards Revealed Banner (sukses setelah reveal) ── */}
      {showRevealedBanner && activeTab === 'board' && (
        <div className="cards-revealed-banner" style={{ marginTop: '16px' }}>
          <div className="cards-revealed-banner-icon">
            <CheckCircle size={17} color="#ffffff" strokeWidth={2.2} />
          </div>
          <div className="cards-revealed-banner-text">
            <strong>Cards Revealed</strong>
            <p>Semua feedback sekarang dapat dilihat oleh anggota.</p>
          </div>
          <button
            type="button"
            className="cards-revealed-banner-close"
            onClick={() => setShowRevealedBanner(false)}
            title="Tutup"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Tab 1: Interactive Board Canvas (Dynamic Template Columns) ── */}
      {activeTab === 'board' && (
        <>
          {/* Action Item Pending dari Sesi Sebelumnya (Awal Sesi Baru) */}
          {previousSessionItems && previousSessionItems.length > 0 && (
            <div className="retro-prev-session-ai-board-wrapper" style={{ padding: '0 28px 16px 28px' }}>
              <PreviousSessionActionItems
                items={previousSessionItems}
                onChangeStatus={handleUpdatePreviousSessionStatus}
                onUpdateDueDate={handleUpdatePreviousSessionDueDate}
              />
            </div>
          )}

          <DndContext sensors={isReadOnly ? [] : sensors} onDragEnd={handleDragEnd}>
          <div className="retro-board-columns-container">
            <div
              className="retro-board-columns-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${activeColumns.length}, minmax(260px, 1fr))`,
                gap: '16px',
              }}
            >
              {activeColumns.map((col) => {
                const seenIds = new Set();
                const colCards = cards
                  .filter(
                    (c) =>
                      c.columnId === col.id ||
                      c.columnId === col.dbId ||
                      c.columnId === col.templateId ||
                      c.columnType === col.id ||
                      c.columnType === col.type ||
                      c.columnType === col.templateId ||
                      c.columnName?.toLowerCase() === col.name?.toLowerCase() ||
                      c.columnId?.toLowerCase() === col.id?.toLowerCase() ||
                      c.columnId?.toLowerCase() === col.type?.toLowerCase() ||
                      c.columnId?.toLowerCase() === col.name?.toLowerCase() ||
                      c.columnId?.toLowerCase() === col.templateId?.toLowerCase()
                  )
                  .filter((card) => {
                    const uniqueKey = card.id || `${card.content}_${card.createdAt}`;
                    if (seenIds.has(uniqueKey)) return false;
                    seenIds.add(uniqueKey);
                    return true;
                  })
                  .map((card) => {
                    const votesNum =
                      typeof card.votesCount === 'number'
                        ? card.votesCount
                        : Array.isArray(card.votes)
                        ? card.votes.length
                        : typeof card.votes === 'number'
                        ? card.votes
                        : 0;
                    const isCardPriority = Boolean(
                      card.isPriority ||
                        (votesNum >= 3 && (votesNum === maxVotes || votesNum >= 10))
                    );
                    return {
                      ...card,
                      isPriority: isCardPriority,
                    };
                  });

                return (
                  <RetroColumn
                    key={col.id}
                    column={col}
                    columns={activeColumns}
                    cards={colCards}
                    onAddCard={handleAddCard}
                    onEditCard={handleEditCard}
                    onDeleteCard={handleDeleteCard}
                    onCopyCard={handleCopyCard}
                    onVoteCard={handleVoteCard}
                    onUngroupCard={handleUngroupCard}
                    onUngroupAll={handleUngroupAll}
                    onRenameGroup={handleRenameGroup}
                    onMoveColumn={handleMoveCardColumn}
                    onMoveGroupColumn={handleMoveGroupColumn}
                    onOpenDetail={(cardToOpen) => setSelectedCardForDetail(cardToOpen)}
                    onConvertToActionItem={handleConvertToActionItem}
                    currentUser={currentUser}
                    isAnonymous={isAnonymous}
                    isFacilitator={isFacilitator}
                    isReadOnly={isReadOnly}
                    actionItems={actionItems}
                    isPrivateMode={isPrivateMode}
                    isRevealed={isRevealed}
                  />
                );
              })}
            </div>
          </div>
        </DndContext>
        </>
      )}

      {/* ── Tab: Dashboard Summary ── */}
      {activeTab === 'dashboard' && (
        <DashboardSummaryView
          workspace={workspace}
          board={board}
          currentUser={currentUser}
          onShowToast={onShowToast}
          onSwitchBoard={onSwitchBoard}
        />
      )}

      {/* ── Tab 3: Action Items ── */}
      {activeTab === 'action-items' && (
        <div className="action-items-tab-content">
          {/* Action Item dari Sesi Sebelumnya */}
          <PreviousSessionActionItems
            items={previousSessionItems}
            onChangeStatus={handleUpdatePreviousSessionStatus}
            onUpdateDueDate={handleUpdatePreviousSessionDueDate}
          />
          {/* Action Items Sesi Ini */}
          <ActionItemsTable
            actionItems={actionItems}
            onChangeStatus={handleChangeActionItemStatus}
            onDelete={handleDeleteActionItem}
            onUpdateDueDate={handleUpdateActionItemDueDate}
          />
        </div>
      )}

      {/* ── Modal Pengaturan Board & Mode Anonymous ── */}
      <BoardSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        board={{ ...board, name: currentBoardTitle, title: currentBoardTitle }}
        isAnonymous={isAnonymous}
        onSave={handleSaveBoardSettings}
      />

      {/* ── Modal Detail Catatan & Komentar ── */}
      <CardDetailModal
        isOpen={Boolean(selectedCardForDetail)}
        onClose={() => setSelectedCardForDetail(null)}
        card={selectedCardForDetail}
        currentUser={currentUser}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onVoteCard={handleVoteCard}
        isAnonymous={isAnonymous}
        isFacilitator={isFacilitator}
      />

      {/* ── Modal Atur Timer Sesi ── */}
      <SessionTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        onStartTimer={handleStartTimer}
        initialMinutes={Math.max(1, Math.round((timerTotal || 900) / 60))}
      />

      {/* ── Modal Waktu Sesi Habis! ── */}
      <SessionTimerEndedModal
        isOpen={isTimerEndedModalOpen}
        onClose={() => {
          setIsTimerEndedModalOpen(false);
          setTimerStatus('idle');
        }}
      />
      {/* ── Modal Convert Card to Action Item ── */}
      <ConvertToActionItemModal
        isOpen={Boolean(convertModalCard)}
        onClose={() => setConvertModalCard(null)}
        card={convertModalCard}
        members={members}
        currentUser={currentUser}
        onConfirm={handleConfirmConvert}
      />

      {/* ── Modal Pilihan Icebreaker (Facilitator) ── */}
      <IcebreakerSelectModal
        isOpen={isIcebreakerSelectModalOpen}
        onClose={() => setIsIcebreakerSelectModalOpen(false)}
        onStartGame={handleStartIcebreaker}
      />

      {/* ── Modal Konfirmasi Reveal Cards (Private Note Feature) ── */}
      <RevealCardsModal
        isOpen={showRevealModal}
        onClose={() => setShowRevealModal(false)}
        onConfirm={handleRevealCards}
        privateCount={totalCardsCount > 0 ? totalCardsCount : cards.length}
      />

      {/* ── Overlay Sesi Icebreaker Aktif / Selesai (Semua Anggota) ── */}
      {activeIcebreaker && (
        <IcebreakerOverlay
          session={activeIcebreaker}
          isFacilitator={isFacilitator}
          currentUser={currentUser}
          totalMembers={totalMemberCount}
          onVote={handleVoteIcebreaker}
          onReveal={handleRevealIcebreaker}
          onSkip={handleSkipIcebreaker}
          onEnd={handleEndIcebreaker}
          onClose={() => setActiveIcebreaker(null)}
        />
      )}

      {/* ── Overlay Sesi Presentation Mode (Semua Anggota & Facilitator) ── */}
      <PresentationOverlay
        isOpen={isPresentationOpen}
        isFacilitator={isFacilitator}
        card={presentationCard}
        currentIndex={presentationIndex}
        totalCards={presentationTotal}
        isFirst={isPresentationFirst}
        isLast={isPresentationLast}
        onNext={handleNextPresentation}
        onPrev={handlePrevPresentation}
        onStop={handleStopPresentation}
        onClose={() => setIsPresentationOpen(false)}
        isNavigating={isNavigatingPresentation}
      />

      {/* ── Modal Konfirmasi Selesaikan Sesi Retrospective ── */}
      {showCompleteModal && (
        <div className="presentation-confirm-backdrop">
          <div className="presentation-confirm-dialog" style={{ maxWidth: '440px' }}>
            <div className="presentation-confirm-icon-wrapper" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <CheckCircle size={32} strokeWidth={2.5} />
            </div>

            <h3 className="presentation-confirm-title">
              Selesaikan Sesi Retrospective?
            </h3>

            <p className="presentation-confirm-subtitle">
              Sesi ini akan ditandai <strong>"Selesai"</strong> dan otomatis dikunci menjadi <strong>Mode Baca Saja</strong>. Seluruh anggota tim tetap dapat melihat catatan, vote, dan action items.
            </p>

            <div className="presentation-confirm-buttons">
              <button
                type="button"
                className="presentation-btn-cancel"
                onClick={() => setShowCompleteModal(false)}
              >
                Batal
              </button>

              <button
                type="button"
                className="presentation-btn-confirm-stop"
                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                onClick={handleCompleteBoard}
              >
                <CheckCircle size={16} strokeWidth={2.2} />
                <span>Selesaikan Sesi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      <EditBoardModal
        isOpen={isEditBoardModalOpen}
        onClose={() => setIsEditBoardModalOpen(false)}
        board={{ id: boardId, title: currentBoardTitle, name: currentBoardTitle, description: board?.description }}
        onSave={handleSaveBoardTitle}
      />
    </div>
  );
}
