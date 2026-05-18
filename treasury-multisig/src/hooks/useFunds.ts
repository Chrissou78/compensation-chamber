// src/hooks/useFunds.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from "@/lib/constants";
import { TREASURY_ABI, GAS_REFILLER_ABI, TEST_TOKEN_ABI } from "@/lib/abi";

export interface WalletInfo {
  name: string;
  address: string;
  usdc: number;
  usdt: number;
  matic: number;
  total: number;
}

// ─── Multi-wallet overview ──────────────────────────────────
export function useWalletOverview() {
  const publicClient = usePublicClient();

  const wallets = [
    { name: "Treasury Controller", address: CONTRACT_ADDRESSES.TREASURY_CONTROLLER },
    { name: "Gas Refiller", address: CONTRACT_ADDRESSES.GAS_REFILLER },
    { name: "Upgrade Governor", address: CONTRACT_ADDRESSES.UPGRADE_GOVERNOR },
  ];

  return useQuery({
    queryKey: ["walletOverview"],
    queryFn: async (): Promise<WalletInfo[]> => {
      if (!publicClient) return [];

      const results: WalletInfo[] = [];

      for (const w of wallets) {
        const addr = w.address as `0x${string}`;
        if (addr === "0x") continue;

        let usdc = 0,
          usdt = 0,
          matic = 0;

        try {
          const raw = await publicClient.getBalance({ address: addr });
          matic = Number(formatUnits(raw, 18));
        } catch {}

        try {
          const [rawUsdc, usdcDec] = await Promise.all([
            publicClient.readContract({
              address: TOKEN_ADDRESSES.USDC,
              abi: TEST_TOKEN_ABI,
              functionName: "balanceOf",
              args: [addr],
            }),
            publicClient.readContract({
              address: TOKEN_ADDRESSES.USDC,
              abi: TEST_TOKEN_ABI,
              functionName: "decimals",
            }),
          ]);
          usdc = Number(formatUnits(rawUsdc as bigint, Number(usdcDec)));
        } catch {}

        try {
          const [rawUsdt, usdtDec] = await Promise.all([
            publicClient.readContract({
              address: TOKEN_ADDRESSES.USDT,
              abi: TEST_TOKEN_ABI,
              functionName: "balanceOf",
              args: [addr],
            }),
            publicClient.readContract({
              address: TOKEN_ADDRESSES.USDT,
              abi: TEST_TOKEN_ABI,
              functionName: "decimals",
            }),
          ]);
          usdt = Number(formatUnits(rawUsdt as bigint, Number(usdtDec)));
        } catch {}

        results.push({ name: w.name, address: addr, usdc, usdt, matic, total: usdc + usdt });
      }

      return results;
    },
    refetchInterval: 30000,
  });
}

// ─── Payout events ──────────────────────────────────────────
export function usePayoutHistory() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["payoutHistory"],
    queryFn: async () => {
      if (!publicClient) return [];

      const treasuryAddr = CONTRACT_ADDRESSES.TREASURY_CONTROLLER as `0x${string}`;
      if (treasuryAddr === "0x") return [];

      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;

        const logs = await publicClient.getLogs({
          address: treasuryAddr,
          event: {
            type: "event",
            name: "OrderExecuted",
            inputs: [
              { type: "bytes32", name: "orderHash", indexed: true },
              { type: "uint8", name: "orderType" },
              { type: "address", name: "token" },
              { type: "uint256", name: "amount" },
              { type: "address", name: "recipient" },
            ],
          },
          fromBlock,
          toBlock: currentBlock,
        });

        return logs.map((l, i) => {
          const args = l.args as {
            orderHash: string;
            orderType: number;
            token: string;
            amount: bigint;
            recipient: string;
          };
          return {
            id: `payout-${i}`,
            orderHash: args.orderHash,
            type: args.orderType === 0 ? "Payout" : args.orderType === 1 ? "Rebalance" : "Staking",
            token: args.token,
            amount: Number(formatUnits(args.amount, 6)),
            recipient: args.recipient,
            blockNumber: Number(l.blockNumber ?? 0),
            txHash: l.transactionHash ?? "0x",
          };
        }).reverse();
      } catch {
        return [];
      }
    },
    refetchInterval: 60000,
  });
}

// ─── Gas refill history ─────────────────────────────────────
export function useRefillHistory() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["refillHistory"],
    queryFn: async () => {
      if (!publicClient) return [];

      const gasAddr = CONTRACT_ADDRESSES.GAS_REFILLER as `0x${string}`;
      if (gasAddr === "0x") return [];

      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;

        const logs = await publicClient.getLogs({
          address: gasAddr,
          event: {
            type: "event",
            name: "ContractRefilled",
            inputs: [
              { type: "address", name: "contractAddress", indexed: true },
              { type: "uint256", name: "amount" },
            ],
          },
          fromBlock,
          toBlock: currentBlock,
        });

        return logs.map((l, i) => {
          const args = l.args as { contractAddress: string; amount: bigint };
          return {
            id: `refill-${i}`,
            contractAddress: args.contractAddress,
            amount: Number(formatUnits(args.amount, 18)),
            blockNumber: Number(l.blockNumber ?? 0),
            txHash: l.transactionHash ?? "0x",
          };
        }).reverse();
      } catch {
        return [];
      }
    },
    refetchInterval: 60000,
  });
}

// ─── Fee swap history ───────────────────────────────────────
export function useFeeSwapHistory() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["feeSwapHistory"],
    queryFn: async () => {
      if (!publicClient) return [];

      const gasAddr = CONTRACT_ADDRESSES.GAS_REFILLER as `0x${string}`;
      if (gasAddr === "0x") return [];

      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;

        const logs = await publicClient.getLogs({
          address: gasAddr,
          event: {
            type: "event",
            name: "FeesSwapped",
            inputs: [
              { type: "address", name: "token", indexed: true },
              { type: "uint256", name: "amountIn" },
              { type: "uint256", name: "amountOut" },
            ],
          },
          fromBlock,
          toBlock: currentBlock,
        });

        return logs.map((l, i) => {
          const args = l.args as { token: string; amountIn: bigint; amountOut: bigint };
          return {
            id: `swap-${i}`,
            token: args.token,
            amountIn: Number(formatUnits(args.amountIn, 6)),
            amountOut: Number(formatUnits(args.amountOut, 18)),
            blockNumber: Number(l.blockNumber ?? 0),
            txHash: l.transactionHash ?? "0x",
          };
        }).reverse();
      } catch {
        return [];
      }
    },
    refetchInterval: 60000,
  });
}
