// src/hooks/useAccessControl.ts
"use client";

import { useAccount } from "wagmi";
import { useAppStore, type AppSection } from "@/store";

/**
 * Check if the connected wallet has access to a given app section.
 * Returns { hasAccess, isEnforced, isLoading }.
 */
export function useHasAccess(section: AppSection) {
  const { address, isConnected } = useAccount();
  const hasAccess = useAppStore((s) => s.hasAccess);
  const accessEnforced = useAppStore((s) => s.accessEnforced);

  return {
    hasAccess: hasAccess(address, section),
    isEnforced: accessEnforced,
    isConnected,
  };
}

/**
 * Retrieve the label from the address book for a given address.
 */
export function useAddressLabel(address: string | undefined): string | undefined {
  const resolveAddressLabel = useAppStore((s) => s.resolveAddressLabel);
  if (!address) return undefined;
  return resolveAddressLabel(address);
}

/**
 * Format address with label from address book if available.
 * Returns "Label (0x1234...abcd)" or just "0x1234...abcd".
 */
export function useFormattedAddress(address: string | undefined): string {
  const label = useAddressLabel(address);
  if (!address) return "";
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return label ? `${label} (${short})` : short;
}
