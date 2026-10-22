import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme:
    localStorage.getItem("friendify-theme") ||
    localStorage.getItem("streamify-theme") ||
    "coffee",
  setTheme: (theme) => {
    localStorage.setItem("friendify-theme", theme);
    set({ theme });
  },
}));
