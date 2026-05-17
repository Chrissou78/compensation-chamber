"use client";

import { useAccount, useBalance } from "wagmi";
import { useValidatorCount, useValidators } from "./useValidators";
import { useActiveProposals } from "./useProposals";

export function useMultisigStatus() {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { total: validatorCount, active: activeValidators } = useValidatorCount();
  const { activeProposals } = useActiveProposals();

  return {
    isConnected,
    address,
    nativeBalance: balanceData?.value || BigInt(0),
    nativeSymbol: balanceData?.symbol || "ETH",
    validatorCount,
    activeValidators,
    pendingProposalsCount: activeProposals.length,
  };
}

export function useIsMultisigMember() {
  const { address } = useAccount();
  const { data: validators } = useValidators();

  const isMember =
    validators?.some(
      (v) => v.address.toLowerCase() === address?.toLowerCase()
    ) || false;
  const validator = validators?.find(
    (v) => v.address.toLowerCase() === address?.toLowerCase()
  );

  return { isMember, validator };
}

export function useCanVote() {
  const { isMember, validator } = useIsMultisigMember();
  return isMember && validator?.status === "ACTIVE";
}

export { useValidators } from "./useValidators";
