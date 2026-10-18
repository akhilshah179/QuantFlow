import { create } from 'zustand';

export type NoticeTone = 'success' | 'error' | 'info' | 'up' | 'down';

export interface Notice {
  id: string;
  tone: NoticeTone;
  title: string;
  message?: string;
  createdAt: number;
}

interface NotificationState {
  /** Currently visible toasts. */
  toasts: Notice[];
  /** Session history shown in the notification centre. */
  history: Notice[];
  unread: number;
  push: (notice: Omit<Notice, 'id' | 'createdAt'>, ttlMs?: number) => string;
  dismiss: (id: string) => void;
  markAllRead: () => void;
  clearHistory: () => void;
}

let seq = 0;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toasts: [],
  history: [],
  unread: 0,

  push: (notice, ttlMs = 4200) => {
    const full: Notice = { ...notice, id: `n${Date.now()}-${seq++}`, createdAt: Date.now() };
    set((state) => ({
      toasts: [...state.toasts.slice(-3), full],
      history: [full, ...state.history].slice(0, 30),
      unread: state.unread + 1,
    }));
    setTimeout(() => get().dismiss(full.id), ttlMs);
    return full.id;
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  markAllRead: () => set({ unread: 0 }),
  clearHistory: () => set({ history: [], unread: 0 }),
}));

/** Fire a toast from anywhere (event handlers, stores, effects). */
export const notify = (notice: Omit<Notice, 'id' | 'createdAt'>, ttlMs?: number) =>
  useNotificationStore.getState().push(notice, ttlMs);
