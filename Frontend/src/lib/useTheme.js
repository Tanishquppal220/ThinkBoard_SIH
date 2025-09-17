import {create} from 'zustand';

export const useThemeStore = create((set) => ({
  theme: "forest", // default
  setTheme: (theme, userId) => {
    localStorage.setItem(`chat-theme-${userId}`, theme);
    set({ theme });
  },
  loadTheme: (userId) => {
    const saved = localStorage.getItem(`chat-theme-${userId}`);
    set({ theme: saved || "night" });
  }
}));
