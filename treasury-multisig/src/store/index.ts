// src/store/index.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Toast types ────────────────────────────────────────────
export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  description?: string;
  duration?: number;
}

// ─── Access rights types ────────────────────────────────────
export type AppSection = "multisig" | "admin" | "funds" | "monitoring";

export interface AccessEntry {
  address: string; // lowercase 0x...
  label: string;
  sections: AppSection[];
}

// ─── Address book types ─────────────────────────────────────
export interface AddressBookEntry {
  address: string; // lowercase 0x...
  label: string;
  notes?: string;
}

// ─── Full state ─────────────────────────────────────────────
interface AppState {
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  // Pending TX
  pendingTxCount: number;
  incrementPendingTx: () => void;
  decrementPendingTx: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Access rights (persisted)
  accessList: AccessEntry[];
  accessEnforced: boolean;
  setAccessEnforced: (enforced: boolean) => void;
  addAccessEntry: (entry: AccessEntry) => void;
  updateAccessEntry: (address: string, entry: Partial<Omit<AccessEntry, "address">>) => void;
  removeAccessEntry: (address: string) => void;
  hasAccess: (address: string | undefined, section: AppSection) => boolean;

  // Address book (persisted)
  addressBook: AddressBookEntry[];
  addAddressBookEntry: (entry: AddressBookEntry) => void;
  updateAddressBookEntry: (address: string, entry: Partial<Omit<AddressBookEntry, "address">>) => void;
  removeAddressBookEntry: (address: string) => void;
  resolveAddressLabel: (address: string) => string | undefined;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ─── Toasts ──────────────────────────────────
      toasts: [],
      addToast: (toast) => {
        const id = Math.random().toString(36).slice(2, 9);
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

      // ─── Pending TX ──────────────────────────────
      pendingTxCount: 0,
      incrementPendingTx: () =>
        set((state) => ({ pendingTxCount: state.pendingTxCount + 1 })),
      decrementPendingTx: () =>
        set((state) => ({
          pendingTxCount: Math.max(0, state.pendingTxCount - 1),
        })),

      // ─── Sidebar ─────────────────────────────────
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // ─── Access rights ───────────────────────────
      accessList: [],
      accessEnforced: false,

      setAccessEnforced: (enforced) => set({ accessEnforced: enforced }),

      addAccessEntry: (entry) =>
        set((state) => ({
          accessList: [
            ...state.accessList.filter(
              (e) => e.address.toLowerCase() !== entry.address.toLowerCase()
            ),
            { ...entry, address: entry.address.toLowerCase() },
          ],
        })),

      updateAccessEntry: (address, updates) =>
        set((state) => ({
          accessList: state.accessList.map((e) =>
            e.address === address.toLowerCase()
              ? { ...e, ...updates }
              : e
          ),
        })),

      removeAccessEntry: (address) =>
        set((state) => ({
          accessList: state.accessList.filter(
            (e) => e.address !== address.toLowerCase()
          ),
        })),

      hasAccess: (address, section) => {
        const state = get();
        // If enforcement is off, everyone has access
        if (!state.accessEnforced) return true;
        // If no address connected, deny
        if (!address) return false;
        const entry = state.accessList.find(
          (e) => e.address === address.toLowerCase()
        );
        // If address not in list at all, deny
        if (!entry) return false;
        return entry.sections.includes(section);
      },

      // ─── Address book ────────────────────────────
      addressBook: [],

      addAddressBookEntry: (entry) =>
        set((state) => ({
          addressBook: [
            ...state.addressBook.filter(
              (e) => e.address.toLowerCase() !== entry.address.toLowerCase()
            ),
            { ...entry, address: entry.address.toLowerCase() },
          ],
        })),

      updateAddressBookEntry: (address, updates) =>
        set((state) => ({
          addressBook: state.addressBook.map((e) =>
            e.address === address.toLowerCase()
              ? { ...e, ...updates }
              : e
          ),
        })),

      removeAddressBookEntry: (address) =>
        set((state) => ({
          addressBook: state.addressBook.filter(
            (e) => e.address !== address.toLowerCase()
          ),
        })),

      resolveAddressLabel: (address) => {
        if (!address) return undefined;
        const state = get();
        const entry = state.addressBook.find(
          (e) => e.address === address.toLowerCase()
        );
        return entry?.label;
      },
    }),
    {
      name: "compensation-chamber-store",
      // Only persist these slices — toasts are ephemeral
      partialize: (state) => ({
        accessList: state.accessList,
        accessEnforced: state.accessEnforced,
        addressBook: state.addressBook,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
