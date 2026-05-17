// src/hooks/useTreasury.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, useReadContract, useBalance, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { getContractConfig } from "@/lib/contract";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { TreasuryBalance, GasReserve } from "@/types";

// Known token addresses on Polygon Amoy / Polygon Mainnet
// These should come from env vars in production
const TOKEN_ADDRESSES = {
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined,
  USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}` | undefined,
};

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useTreasuryBalance() {
  const { isConnected } = useAccount();
  const treasuryAddress = CONTRACT_ADDRESSES.TREASURY_CONTROLLER as `0x${string}`;
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["treasuryBalance", treasuryAddress],
    queryFn: async (): Promise<TreasuryBalance> => {
      if (!publicClient || treasuryAddress === "0x") {
        // Return zeros when no contract is deployed
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

      // Fetch USDC balance
      if (TOKEN_ADDRESSES.USDC) {
        try {
          const usdcBalance = await publicClient.readContract({
            address: TOKEN_ADDRESSES.USDC,
            abi: ERC20_BALANCE_ABI,
            functionName: "balanceOf",
            args: [treasuryAddress],
          });
          usdc = Number(formatUnits(usdcBalance, 6));
        } catch {
          // Token not available
        }
      }

      // Fetch USDT balance
      if (TOKEN_ADDRESSES.USDT) {
        try {
          const usdtBalance = await publicClient.readContract({
            address: TOKEN_ADDRESSES.USDT,
            abi: ERC20_BALANCE_ABI,
            functionName: "balanceOf",
            args: [treasuryAddress],
          });
          usdt = Number(formatUnits(usdtBalance, 6));
        } catch {
          // Token not available
        }
      }

      return {
        usdc,
        usdt,
        matic,
        total: usdc + usdt, // Total stablecoin value
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
      enabled: config.address !== "0x",
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

  // The contracts that need gas reserves
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
    query: { enabled: config.address !== "0x" },
  });

  const { data: usdtFees } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "usdtAccumulated",
    query: { enabled: config.address !== "0x" },
  });

  return {
    usdc: usdcFees ? Number(formatUnits(usdcFees as bigint, 6)) : 0,
    usdt: usdtFees ? Number(formatUnits(usdtFees as bigint, 6)) : 0,
  };
}
