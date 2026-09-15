/**
 * Utility terpusat untuk menghasilkan URL Avatar secara 100% konsisten di seluruh aplikasi.
 * 
 * Aturan:
 * 1. Jika user memiliki avatarUrl kustom (misal base64 atau URL eksternal), gunakan itu langsung.
 * 2. Jika tidak ada / null, gunakan Dicebear avataaars dengan parameter dan seed yang konsisten.
 * 3. Seed diutamakan email (karena unik per akun), lalu name, lalu fallback.
 * 4. Parameter &mouth=smile,twinkle&eyes=default,happy,wink selalu diterapkan agar ekspresi seragam dan ramah.
 */
export function getUserAvatar(user, fallbackName = '') {
  if (!user) {
    const seed = fallbackName || 'user';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&mouth=smile,twinkle&eyes=default,happy,wink`;
  }

  // Jika input berupa string (bisa URL atau nama/seed)
  if (typeof user === 'string') {
    const trimmed = user.trim();
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('/')
    ) {
      return trimmed;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmed || fallbackName || 'user')}&mouth=smile,twinkle&eyes=default,happy,wink`;
  }

  // Jika user memiliki avatarUrl
  if (user.avatarUrl && typeof user.avatarUrl === 'string' && user.avatarUrl.trim() !== '') {
    return user.avatarUrl.trim();
  }

  // Jika user memiliki avatar
  if (user.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '') {
    if (
      user.avatar.startsWith('http://') ||
      user.avatar.startsWith('https://') ||
      user.avatar.startsWith('data:image/') ||
      user.avatar.startsWith('/')
    ) {
      return user.avatar.trim();
    }
  }

  // Seed yang konsisten: Utamakan email, lalu name, lalu fallbackName
  const seed = user.email || user.name || fallbackName || 'user';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&mouth=smile,twinkle&eyes=default,happy,wink`;
}
