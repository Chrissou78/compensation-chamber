// src/store/index.ts
import { create } from "zustand";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  description?: string;
  duration?: number;
}

interface AppState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  pendingTxCount: number;
  incrementPendingTx: () => void;
  decrementPendingTx: () => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 9);
    // Normalize: accept both `message` and `description`
    const normalized = {
      ...toast,
      description: toast.description || toast.message,
      id,
    };
    set((state) => ({
      toasts: [...state.toasts, normalized],
    }));
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  pendingTxCount: 0,
  incrementPendingTx: () =>
    set((state) => ({ pendingTxCount: state.pendingTxCount + 1 })),
  decrementPendingTx: () =>
    set((state) => ({
      pendingTxCount: Math.max(0, state.pendingTxCount - 1),
    })),

  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
