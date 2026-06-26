import { create } from 'zustand';

export type SidebarPanelType = 'notifications' | 'search' | 'create' | 'settings' | null;

interface SidebarStore {
  activePanel: SidebarPanelType;
  openPanel: (panel: SidebarPanelType) => void;
  closePanel: () => void;
  togglePanel: (panel: SidebarPanelType) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  activePanel: null,
  openPanel: (panel) => set({ activePanel: panel }),
  closePanel: () => set({ activePanel: null }),
  togglePanel: (panel) =>
    set((state) => ({
      activePanel: state.activePanel === panel ? null : panel,
    })),
}));
