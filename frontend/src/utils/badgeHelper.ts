export const BADGES = [
  'Scholar',
  'Speedy',
  'Rookie',
  'Brainy',
  'Champion',
  'Challenger',
  'Strategist',
];

/**
 * Resolve the display title/badge for a player.
 *
 * Priority:
 *  1. `equippedTitle` passed directly from the API response  (most accurate)
 *  2. Equipped title stored for the current user in localStorage  (fallback for self)
 *  3. Deterministic hash-based badge derived from the player name (last-resort for guests)
 *
 * @param name          The player's nickname
 * @param equippedTitle The `equipped_title` field from the API participant data (may be null/undefined)
 */
export const getPlayerBadge = (name: string, equippedTitle?: string | null): string => {
  // 1. Use the title directly provided from the API (most accurate)
  if (equippedTitle) {
    return equippedTitle;
  }

  // 2. Check if this is the current logged-in user and fall back to localStorage
  const cleanName = (name || '').trim().toLowerCase();
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      const u = JSON.parse(stored);
      const storedName = (u.name || u.fullname || u.nickname || u.email || '')
        .trim()
        .toLowerCase();
      const playNickname = (sessionStorage.getItem('play_nickname') || '').trim().toLowerCase();

      const isSelf =
        storedName &&
        cleanName &&
        (storedName === cleanName ||
          cleanName.includes(storedName) ||
          storedName.includes(cleanName) ||
          (playNickname && cleanName === playNickname));

      if (isSelf) {
        const selfTitle =
          u.equipped_title ||
          u.equippedTitle ||
          localStorage.getItem('equipped_title') ||
          sessionStorage.getItem('equipped_title');
        if (selfTitle) return selfTitle;
      }
    } catch (_) {}
  }

  // 3. Deterministic hash-based fallback for guests / other players
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BADGES[Math.abs(hash) % BADGES.length];
};

export const getBadgeStyle = (badge: string): string => {
  switch (badge) {
    case 'Champion':
    case 'Quiz Master':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Scholar':
    case 'Night Owl':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Speedy':
    case 'Unstoppable':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    case 'Brainy':
    case 'Sharpshooter':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Challenger':
    case 'First Blood':
      return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'Guru':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'Strategist':
    case 'Rookie':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    default:
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
  }
};
