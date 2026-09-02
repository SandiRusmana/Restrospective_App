import { useEffect, useState, useRef } from 'react';
import { getPusherClient } from '../services/pusher';

/**
 * Custom hook untuk subscribe channel Pusher dan mendengarkan event realtime retro board
 * serta melacak kehadiran anggota online secara nyata (presence channel).
 *
 * @param {string} boardId - ID board retro yang sedang dibuka
 * @param {Object} [currentUser] - Data pengguna yang sedang login
 * @param {Object} [handlers] - Objek callback event
 * @param {Function} [handlers.onCardCreated] - Callback saat card baru dibuat
 * @param {Function} [handlers.onCardUpdated] - Callback saat card diupdate
 * @param {Function} [handlers.onCardDeleted] - Callback saat card dihapus
 * @param {Function} [handlers.onVoteUpdated] - Callback saat vote card berubah
 * @param {Function} [handlers.onCommentCreated] - Callback saat komentar baru ditambahkan
 * @param {Function} [handlers.onTimerUpdated] - Callback saat timer board diupdate
 */
export function useBoardPusher(boardId, currentUser, handlers = {}) {
  // Jika argumen kedua adalah object handlers (kompatibilitas backward)
  const actualHandlers = typeof currentUser === 'function' || (currentUser && !currentUser.email && !currentUser.id)
    ? currentUser
    : handlers;
  const user = currentUser && (currentUser.email || currentUser.id) ? currentUser : null;

  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const handlersRef = useRef(actualHandlers);

  useEffect(() => {
    handlersRef.current = actualHandlers;
  }, [actualHandlers]);

  useEffect(() => {
    if (!boardId) return;

    let pusher;
    try {
      pusher = getPusherClient();
    } catch (err) {
      console.error('[useBoardPusher] Gagal inisialisasi Pusher:', err);
      setConnectionStatus('failed');
      setIsConnected(false);
      return;
    }

    const presenceChannelName = `presence-board-${boardId}`;
    const privateChannelName = `private-board-${boardId}`;
    let presenceChannel;
    let privateChannel;

    try {
      presenceChannel = pusher.subscribe(presenceChannelName);
      privateChannel = pusher.subscribe(privateChannelName);
    } catch (err) {
      console.error(`[useBoardPusher] Gagal subscribe ke channels board:`, err);
      return;
    }

    // Monitor status koneksi Pusher
    const handleStateChange = (states) => {
      setConnectionStatus(states.current);
      setIsConnected(states.current === 'connected');
    };

    pusher.connection.bind('state_change', handleStateChange);
    setConnectionStatus(pusher.connection.state);
    setIsConnected(pusher.connection.state === 'connected');

    // Subscribe success handler untuk presence channel
    presenceChannel.bind('pusher:subscription_succeeded', (members) => {
      setConnectionStatus('connected');
      setIsConnected(true);

      const activeList = [];
      if (members) {
        members.each((m) => {
          activeList.push({
            id: m.id,
            name: m.info?.name || 'Anggota Tim',
            email: m.info?.email || '',
            avatarUrl:
              m.info?.avatarUrl ||
              m.info?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.info?.email || m.info?.name || m.id}`,
          });
        });
      }

      if (activeList.length > 0) {
        setOnlineMembers(activeList);
      } else if (user) {
        const myEmail = user.email || '';
        const myName = user.name || user.fullName || (myEmail ? myEmail.split('@')[0] : 'user');
        setOnlineMembers([
          {
            id: user.id || 'me',
            name: myName,
            email: myEmail,
            avatarUrl:
              user.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${myEmail || myName}`,
          },
        ]);
      }
    });

    // Anggota baru bergabung
    presenceChannel.bind('pusher:member_added', (member) => {
      setOnlineMembers((prev) => {
        if (prev.some((m) => m.id === member.id)) return prev;
        return [
          ...prev,
          {
            id: member.id,
            name: member.info?.name || 'Anggota Tim',
            email: member.info?.email || '',
            avatarUrl:
              member.info?.avatarUrl ||
              member.info?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.info?.email || member.info?.name || member.id}`,
          },
        ];
      });
    });

    // Anggota keluar / disconnect
    presenceChannel.bind('pusher:member_removed', (member) => {
      setOnlineMembers((prev) => prev.filter((m) => m.id !== member.id));
    });

    // Subscribe error handler
    presenceChannel.bind('pusher:subscription_error', (error) => {
      console.warn(`[useBoardPusher] Presence subscription error:`, error);
      setConnectionStatus('unavailable');
      setIsConnected(false);
    });

    // Bind event-event realtime pada channel
    const bindEvents = (ch) => {
      ch.bind('card.created', (data) => {
        if (handlersRef.current?.onCardCreated) handlersRef.current.onCardCreated(data);
      });
      ch.bind('card.updated', (data) => {
        if (handlersRef.current?.onCardUpdated) handlersRef.current.onCardUpdated(data);
      });
      ch.bind('card.deleted', (data) => {
        if (handlersRef.current?.onCardDeleted) handlersRef.current.onCardDeleted(data);
      });
      ch.bind('vote.updated', (data) => {
        if (handlersRef.current?.onVoteUpdated) handlersRef.current.onVoteUpdated(data);
      });
      ch.bind('comment.created', (data) => {
        if (handlersRef.current?.onCommentCreated) handlersRef.current.onCommentCreated(data);
      });
      ch.bind('card.grouped', (data) => {
        if (handlersRef.current?.onCardGrouped) handlersRef.current.onCardGrouped(data);
      });
      ch.bind('timer.updated', (data) => {
        if (handlersRef.current?.onTimerUpdated) handlersRef.current.onTimerUpdated(data);
      });
    };

    bindEvents(presenceChannel);
    bindEvents(privateChannel);

    return () => {
      pusher.connection.unbind('state_change', handleStateChange);
      if (presenceChannel) {
        presenceChannel.unbind_all();
        pusher.unsubscribe(presenceChannelName);
      }
      if (privateChannel) {
        privateChannel.unbind_all();
        pusher.unsubscribe(privateChannelName);
      }
    };
  }, [boardId]);

  return {
    isConnected,
    connectionStatus,
    onlineMembers,
    onlineCount: Math.max(onlineMembers.length, 1),
  };
}
