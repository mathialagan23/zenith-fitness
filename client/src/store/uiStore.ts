import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

interface UIState {
  isSidebarOpen: boolean;
  isMobileNavVisible: boolean;
  theme: "dark" | "light";
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileNavVisible: (visible: boolean) => void;
  setTheme: (theme: "dark" | "light") => void;
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isMobileNavVisible: true,
      theme: "dark",

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      setMobileNavVisible: (visible) => set({ isMobileNavVisible: visible }),
      setTheme: (theme) => set({ theme }),
      showToast: (message, type = "info") => {
        switch (type) {
          case "success":
            toast.success(message);
            break;
          case "error":
            toast.error(message);
            break;
          case "warning":
            toast.warning(message);
            break;
          default:
            toast.info(message);
        }
      },
    }),
    {
      name: "zenith-ui",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
