import Pusher from 'pusher-js';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || '44b759c87bc344407314';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap1';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let pusherInstance = null;

/**
 * Mendapatkan singleton instance Pusher client
 */
export function getPusherClient() {
  if (!pusherInstance) {
    pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: `${API_BASE_URL}/pusher/auth`,
      authorizer: (channel) => {
        return {
          authorize: async (socketId, callback) => {
            try {
              const token = localStorage.getItem('access_token');
              const response = await fetch(`${API_BASE_URL}/pusher/auth`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Otorisasi Pusher gagal (status ${response.status})`);
              }

              const authData = await response.json();
              callback(null, authData);
            } catch (err) {
              console.error('[Pusher Auth Error]', err);
              callback(err, null);
            }
          },
        };
      },
    });
  }

  return pusherInstance;
}

/**
 * Membersihkan / disconnect pusher client saat logout
 */
export function disconnectPusher() {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}
