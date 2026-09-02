import { useEffect, useState, useRef } from 'react';
import { getPusherClient } from '../services/pusher';

/**
 * Custom hook untuk subscribe channel Pusher dan mendengarkan event realtime retro board
 *
 * @param {string} boardId - ID board retro yang sedang dibuka
 * @param {Object} handlers - Objek callback event
 * @param {Function} [handlers.onCardCreated] - Callback saat card baru dibuat
 * @param {Function} [handlers.onCardUpdated] - Callback saat card diupdate
 * @param {Function} [handlers.onCardDeleted] - Callback saat card dihapus
 * @param {Function} [handlers.onVoteUpdated] - Callback saat vote card berubah
 * @param {Function} [handlers.onCommentCreated] - Callback saat komentar baru ditambahkan
 * @param {Function} [handlers.onTimerUpdated] - Callback saat timer board diupdate
 */
export function useBoardPusher(boardId, handlers = {}) {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef(handlers);

  // Selalu simpan handlers terbaru di ref agar tidak memicu re-subscribe
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

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

    const channelName = `private-board-${boardId}`;
    let channel;

    try {
      channel = pusher.subscribe(channelName);
    } catch (err) {
      console.error(`[useBoardPusher] Gagal subscribe ke ${channelName}:`, err);
      return;
    }

    // Monitor status koneksi Pusher
    const handleStateChange = (states) => {
      setConnectionStatus(states.current);
      setIsConnected(states.current === 'connected');
    };

    pusher.connection.bind('state_change', handleStateChange);
    // Inisialisasi status awal
    setConnectionStatus(pusher.connection.state);
    setIsConnected(pusher.connection.state === 'connected');

    // Subscribe success handler
    channel.bind('pusher:subscription_succeeded', () => {
      setConnectionStatus('connected');
      setIsConnected(true);
    });

    // Subscribe error handler
    channel.bind('pusher:subscription_error', (error) => {
      console.warn(`[useBoardPusher] Subscription error pada ${channelName}:`, error);
      setConnectionStatus('unavailable');
      setIsConnected(false);
    });

    // Event: card.created
    channel.bind('card.created', (data) => {
      if (handlersRef.current.onCardCreated) {
        handlersRef.current.onCardCreated(data);
      }
    });

    // Event: card.updated
    channel.bind('card.updated', (data) => {
      if (handlersRef.current.onCardUpdated) {
        handlersRef.current.onCardUpdated(data);
      }
    });

    // Event: card.deleted
    channel.bind('card.deleted', (data) => {
      if (handlersRef.current.onCardDeleted) {
        handlersRef.current.onCardDeleted(data);
      }
    });

    // Event: vote.updated
    channel.bind('vote.updated', (data) => {
      if (handlersRef.current.onVoteUpdated) {
        handlersRef.current.onVoteUpdated(data);
      }
    });

    // Event: comment.created
    channel.bind('comment.created', (data) => {
      if (handlersRef.current.onCommentCreated) {
        handlersRef.current.onCommentCreated(data);
      }
    });

    // Event: timer.updated
    channel.bind('timer.updated', (data) => {
      if (handlersRef.current.onTimerUpdated) {
        handlersRef.current.onTimerUpdated(data);
      }
    });

    return () => {
      pusher.connection.unbind('state_change', handleStateChange);
      if (channel) {
        channel.unbind_all();
        pusher.unsubscribe(channelName);
      }
    };
  }, [boardId]);

  return {
    isConnected,
    connectionStatus,
  };
}
