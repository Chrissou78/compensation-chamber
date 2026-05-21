// src/hooks/useFunding.ts
"use client";

import { useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useSendTransaction,
} from "wagmi";
import { type Address, formatUnits, parseEther, parseUnits } from "viem";
import { useQuery } from "@tanstack/react-query";
import { CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from "@/lib/constants";
import { GAS_REFILLER_ABI, TEST_TOKEN_ABI } from "@/lib/abi";
import { useAppStore } from "@/store";

const gasRefillerAddress = CONTRACT_ADDRESSES.GAS_REFILLER as Address;

// ─── 1. Send POL to GasRefiller ────────────────────────────
export function useFundGasRefiller() {
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const fundGasRefiller = useCallback(
    (amountPol: string) => {
      sendTransaction(
        {
          to: gasRefillerAddress,
          value: parseEther(amountPol),
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "POL sent to GasRefiller",
              message: `${amountPol} POL deposited`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Deposit failed",
              message: err.message.slice(0, 120),
            }),
        }
      );
    },
    [sendTransaction, addToast]
  );

  return { fundGasRefiller, isPending: isPending || isConfirming, isSuccess, hash, error };
}

// ─── 2. Register a contract for gas reserves ────────────────
export function useRegisterContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const registerContract = useCallback(
    (contractAddress: Address, targetPol: string, thresholdPol: string) => {
      writeContract(
        {
          address: gasRefillerAddress,
          abi: GAS_REFILLER_ABI,
          functionName: "registerContractGasReserve",
          args: [contractAddress, parseEther(targetPol), parseEther(thresholdPol)],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Contract registered",
              message: `Target: ${targetPol} POL, Threshold: ${thresholdPol} POL`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Registration failed",
              message: err.message.slice(0, 120),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  return { registerContract, isPending: isPending || isConfirming, isSuccess, hash, error };
}

// ─── 3. Refill a specific contract from GasRefiller ─────────
export function useRefillFromGasRefiller() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const refillContract = useCallback(
    (contractAddress: Address, amountPol: string) => {
      writeContract(
        {
          address: gasRefillerAddress,
          abi: GAS_REFILLER_ABI,
          functionName: "refillContractGas",
          args: [contractAddress, parseEther(amountPol)],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Contract refilled",
              message: `${amountPol} POL sent from GasRefiller`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Refill failed",
              message: err.message.slice(0, 120),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  return { refillContract, isPending: isPending || isConfirming, isSuccess, hash, error };
}

// ─── 4. Refill ALL contracts that need it ───────────────────
export function useRefillAll() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);
  const publicClient = usePublicClient();

  const refillAll = useCallback(async () => {
    if (!publicClient) return;

    const contractKeys = [
      "TREASURY_CONTROLLER",
      "UPGRADE_GOVERNOR",
      "VALIDATOR_REGISTRY",
      "GOVERNANCE_TOKEN",
      "PAYOUT_EXECUTOR",
      "REBALANCING_EXECUTOR",
      "STAKING_EXECUTOR",
      "VARIABLE_TIMELOCK",
    ] as const;

    let refilled = 0;

    for (const key of contractKeys) {
      const addr = CONTRACT_ADDRESSES[key] as Address;
      if (!addr || addr === "0x") continue;

      try {
        // Check if registered and needs refill
        const reserveRaw = await publicClient.readContract({
            address: gasRefillerAddress,
            abi: GAS_REFILLER_ABI,
            functionName: "contractGasReserves",
            args: [addr],
        });

        // Public mapping getter returns positional tuple:
        // [contractAddress, targetMatic, thresholdMatic, active]
        const reserve = reserveRaw as unknown as [Address, bigint, bigint, boolean];
        const [, targetMatic, thresholdMatic, active] = reserve;

        if (!active) continue;

        const currentBalance = await publicClient.getBalance({ address: addr });

        if (currentBalance < thresholdMatic) {
            // Calculate how much to send (top up to target)
            const deficit = targetMatic - currentBalance;

            writeContract({
                address: gasRefillerAddress,
                abi: GAS_REFILLER_ABI,
                functionName: "refillContractGas",
                args: [addr, deficit],
            });

            refilled++;
            break;
        }
      } catch {
        // skip
      }
    }

    if (refilled === 0) {
      addToast({ type: "info", title: "All contracts healthy", message: "No contracts need refilling" });
    }
  }, [publicClient, writeContract, addToast]);

  return { refillAll, isPending: isPending || isConfirming, isSuccess, hash, error };
}

// ─── 5. GasRefiller POL balance ─────────────────────────────
export function useGasRefillerBalance() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["gasRefillerBalance"],
    queryFn: async () => {
      if (!publicClient) return 0;
      const balance = await publicClient.getBalance({ address: gasRefillerAddress });
      return Number(formatUnits(balance, 18));
    },
    refetchInterval: 15000,
  });
}

// ─── 6. Mint test tokens (Amoy only) ───────────────────────
export function useMintTestTokens() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const mintTokens = useCallback(
    (token: "USDC" | "USDT", recipient: Address, amount: string) => {
      const tokenAddress = TOKEN_ADDRESSES[token];
      // Test tokens have 6 decimals
      const parsedAmount = parseUnits(amount, 6);

      writeContract(
        {
          address: tokenAddress,
          abi: TEST_TOKEN_ABI,
          functionName: "Mint",
          args: [recipient, parsedAmount],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: `${token} minted`,
              message: `${amount} ${token} minted to ${recipient.slice(0, 6)}...`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Mint failed",
              message: err.message.slice(0, 120),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  return { mintTokens, isPending: isPending || isConfirming, isSuccess, hash, error };
}

// ─── 7. Transfer tokens to TreasuryController ───────────────
export function useTransferToTreasury() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);
  const treasuryAddress = CONTRACT_ADDRESSES.TREASURY_CONTROLLER as Address;

  // ERC20 transfer
  const transferTokens = useCallback(
    (token: "USDC" | "USDT", amount: string) => {
      const tokenAddress = TOKEN_ADDRESSES[token];
      const parsedAmount = parseUnits(amount, 6);

      // We use the standard ERC20 transfer function
      writeContract(
        {
          address: tokenAddress,
          abi: [
            {
              name: "transfer",
              type: "function",
              stateMutability: "nonpayable",
              inputs: [
                { name: "to", type: "address" },
                { name: "value", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
            },
          ] as const,
          functionName: "transfer",
          args: [treasuryAddress, parsedAmount],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: `${token} transferred`,
              message: `${amount} ${token} sent to TreasuryController`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Transfer failed",
              message: err.message.slice(0, 120),
            }),
        }
      );
    },
    [writeContract, addToast, treasuryAddress]
  );

  return { transferTokens, isPending: isPending || isConfirming, isSuccess, hash, error };
}
