// src/components/AddressDisplay.tsx
"use client";

import { useAddressLabel } from "@/hooks/useAccessControl";
import { formatAddress } from "@/lib/utils";

interface AddressDisplayProps {
  address: string;
  full?: boolean;
  className?: string;
}

/**
 * Renders an address with its label from the address book.
 * "CEO (0x1234...abcd)" or just "0x1234...abcd" if no label.
 */
export function AddressDisplay({ address, full = false, className = "" }: AddressDisplayProps) {
  const label = useAddressLabel(address);
  const short = formatAddress(address);
  const display = full ? address : short;

  if (!label) {
    return <span className={`font-mono ${className}`}>{display}</span>;
  }

  return (
    <span className={className}>
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground font-mono ml-1 text-[0.85em]">({short})</span>
    </span>
  );
}
