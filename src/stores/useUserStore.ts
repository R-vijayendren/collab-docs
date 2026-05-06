import { create } from 'zustand';
import { USER_COLORS, RANDOM_NAMES } from '@/lib/constants';

interface UserState {
  name: string;
  color: string;
  hydrated: boolean;
  setName: (name: string) => void;
  randomize: () => void;
  hydrate: () => void;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUser() {
  return { name: pickRandom(RANDOM_NAMES), color: pickRandom(USER_COLORS) };
}

function persist(user: { name: string; color: string }) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('collab-user', JSON.stringify(user));
  }
}

export const useUserStore = create<UserState>()((set, get) => ({
  name: 'Anonymous',
  color: USER_COLORS[0],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('collab-user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        set({ name: parsed.name, color: parsed.color, hydrated: true });
        return;
      } catch { /* fall through */ }
    }

    const user = generateUser();
    persist(user);
    set({ ...user, hydrated: true });
  },

  setName: (name) => {
    const color = get().color;
    persist({ name, color });
    set({ name });
  },

  randomize: () => {
    const user = generateUser();
    persist(user);
    set({ name: user.name, color: user.color });
  },
}));
