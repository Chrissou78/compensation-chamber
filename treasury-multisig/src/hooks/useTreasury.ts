// src/hooks/useTreasury.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { getContractConfig } from "@/lib/contract";
import { CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from "@/lib/constants";
import { TEST_TOKEN_ABI } from "@/lib/abi";
import { TreasuryBalance, GasReserve } from "@/types";

export function useTreasuryBalance() {
  const { isConnected } = useAccount();
  const treasuryAddress = CONTRACT_ADDRESSES.TREASURY_CONTROLLER as `0x${string}`;
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["treasuryBalance", treasuryAddress],
    queryFn: async (): Promise<TreasuryBalance> => {
      if (!publicClient || treasuryAddress === "0x") {
        return { usdc: 0, usdt: 0, matic: 0, total: 0 };
      }

      let usdc = 0;
      let usdt = 0;
      let matic = 0;

      // Fetch MATIC balance
      try {
        const maticBalance = await publicClient.getBalance({
          address: treasuryAddress,
        });
        matic = Number(formatUnits(maticBalance, 18));
      } catch {
        // Contract not deployed yet
      }

      // Fetch USDC balance — use TEST_TOKEN_ABI (decimals read dynamically)
      try {
        const [usdcRaw, usdcDecimals] = await Promise.all([
          publicClient.readContract({
            address: TOKEN_ADDRESSES.USDC,
            abi: TEST_TOKEN_ABI,
            functionName: "balanceOf",
            args: [treasuryAddress],
          }),
          publicClient.readContract({
            address: TOKEN_ADDRESSES.USDC,
            abi: TEST_TOKEN_ABI,
            functionName: "decimals",
          }),
        ]);
        usdc = Number(formatUnits(usdcRaw, usdcDecimals));
      } catch {
        // Token not available on this chain
      }

      // Fetch USDT balance
      try {
        const [usdtRaw, usdtDecimals] = await Promise.all([
          publicClient.readContract({
            address: TOKEN_ADDRESSES.USDT,
            abi: TEST_TOKEN_ABI,
            functionName: "balanceOf",
            args: [treasuryAddress],
          }),
          publicClient.readContract({
            address: TOKEN_ADDRESSES.USDT,
            abi: TEST_TOKEN_ABI,
            functionName: "decimals",
          }),
        ]);
        usdt = Number(formatUnits(usdtRaw, usdtDecimals));
      } catch {
        // Token not available on this chain
      }

      return {
        usdc,
        usdt,
        matic,
        total: usdc + usdt,
      };
    },
    enabled: isConnected,
    refetchInterval: 30000,
  });
}

export function useTreasuryPaused() {
  const config = getContractConfig("treasury");

  const { data, isLoading } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "paused",
    query: {
      enabled: config.address !== ("0x" as `0x${string}`),
    },
  });

  return {
    isPaused: (data as boolean) ?? false,
    isLoading,
  };
}

export function useGasReserves() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();

  const MONITORED_CONTRACTS: {
    name: string;
    addressKey: keyof typeof CONTRACT_ADDRESSES;
    targetMatic: number;
    thresholdMatic: number;
  }[] = [
    { name: "TreasuryController", addressKey: "TREASURY_CONTROLLER", targetMatic: 4, thresholdMatic: 1 },
    { name: "UpgradeGovernor", addressKey: "UPGRADE_GOVERNOR", targetMatic: 4, thresholdMatic: 1 },
    { name: "ValidatorRegistry", addressKey: "VALIDATOR_REGISTRY", targetMatic: 4, thresholdMatic: 1 },
    { name: "GasRefiller", addressKey: "GAS_REFILLER", targetMatic: 4, thresholdMatic: 1 },
    { name: "GovernanceToken", addressKey: "GOVERNANCE_TOKEN", targetMatic: 4, thresholdMatic: 1 },
    { name: "VariableTimelock", addressKey: "VARIABLE_TIMELOCK", targetMatic: 4, thresholdMatic: 1 },
  ];

  return useQuery({
    queryKey: ["gasReserves"],
    queryFn: async (): Promise<GasReserve[]> => {
      if (!publicClient) return [];

      const reserves: GasReserve[] = [];

      for (const contract of MONITORED_CONTRACTS) {
        const address = CONTRACT_ADDRESSES[contract.addressKey] as `0x${string}`;
        if (address === "0x") continue;

        let currentBalance = 0;
        try {
          const balance = await publicClient.getBalance({ address });
          currentBalance = Number(formatUnits(balance, 18));
        } catch {
          // Contract not deployed
        }

        reserves.push({
          contractName: contract.name,
          contractAddress: address,
          currentBalance,
          targetBalance: contract.targetMatic,
          refillThreshold: contract.thresholdMatic,
        });
      }

      return reserves;
    },
    enabled: isConnected,
    refetchInterval: 60000,
  });
}

export function useAccumulatedFees() {
  const config = getContractConfig("gas");

  const { data: usdcFees } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "usdcAccumulated",
    query: { enabled: config.address !== ("0x" as `0x${string}`) },
  });

  const { data: usdtFees } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "usdtAccumulated",
    query: { enabled: config.address !== ("0x" as `0x${string}`) },
  });

  return {
    usdc: usdcFees ? Number(formatUnits(usdcFees as bigint, 6)) : 0,
    usdt: usdtFees ? Number(formatUnits(usdtFees as bigint, 6)) : 0,
  };
}

// ─── Token-specific hooks ────────────────────────────────────
export function useTokenBalance(
  token: "USDC" | "USDT",
  walletAddress?: `0x${string}`
) {
  const publicClient = usePublicClient();
  const { address: connectedAddress } = useAccount();
  const target = walletAddress || connectedAddress;

  return useQuery({
    queryKey: ["tokenBalance", token, target],
    queryFn: async () => {
      if (!publicClient || !target) return { balance: 0, symbol: token, decimals: 6 };

      const tokenAddress = TOKEN_ADDRESSES[token];

      const [rawBalance, decimals, symbol] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: TEST_TOKEN_ABI,
          functionName: "balanceOf",
          args: [target],
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: TEST_TOKEN_ABI,
          functionName: "decimals",
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: TEST_TOKEN_ABI,
          functionName: "symbol",
        }),
      ]);

      return {
        balance: Number(formatUnits(rawBalance, decimals)),
        symbol: symbol as string,
        decimals: Number(decimals),
      };
    },
    enabled: !!target,
    refetchInterval: 30000,
  });
}

export function useTokenInfo(token: "USDC" | "USDT") {
  const config = getContractConfig("gas");
  const tokenAddress = TOKEN_ADDRESSES[token];

  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: TEST_TOKEN_ABI,
    functionName: "name",
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: TEST_TOKEN_ABI,
    functionName: "symbol",
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: TEST_TOKEN_ABI,
    functionName: "decimals",
  });

  return {
    address: tokenAddress,
    name: (name as string) ?? token,
    symbol: (symbol as string) ?? token,
    decimals: decimals ? Number(decimals) : 6,
  };
}
