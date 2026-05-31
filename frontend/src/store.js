import { create } from 'zustand';

export const useStore = create((set, get) => ({
  theme: localStorage.getItem('crm_theme') || 'light',
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  notifications: [],
  activityScore: 0,
  streak: 3,

  setTheme: (theme) => {
    localStorage.setItem('crm_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleCommandPalette: () => set(s => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),

  addScore: (pts) => set(s => ({ activityScore: Math.min(100, s.activityScore + pts) })),
}));
