// src/hooks/useOrderSigning.ts
"use client";

import { useCallback, useState } from "react";
import { useAccount, useChainId, useSignTypedData, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { type Address, parseUnits } from "viem";
import { CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from "@/lib/constants";
import { TREASURY_ABI } from "@/lib/abi";
import {
  OrderType,
  Order,
  createOrder,
  getOrderTypedData,
} from "@/lib/eip712";
import { useAppStore } from "@/store";

const treasuryAddress = CONTRACT_ADDRESSES.TREASURY_CONTROLLER as Address;

// ─── 1. Sign an Order ───────────────────────────────────────
export function useSignOrder() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();
  const addToast = useAppStore((s) => s.addToast);
  const [isPending, setIsPending] = useState(false);

  const signOrder = useCallback(
    async (order: Order): Promise<`0x${string}` | null> => {
      if (!address || !chainId) {
        addToast({ type: "error", title: "Sign failed", message: "Wallet not connected" });
        return null;
      }

      setIsPending(true);
      try {
        const typedData = getOrderTypedData(chainId, treasuryAddress, order);
        const signature = await signTypedDataAsync({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        });

        addToast({
          type: "success",
          title: "Order signed",
          message: `Signature from ${address.slice(0, 6)}...${address.slice(-4)}`,
        });

        return signature;
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Signing failed",
          message: err?.message?.slice(0, 100) || "User rejected signature",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [address, chainId, signTypedDataAsync, addToast]
  );

  return { signOrder, isPending };
}

// ─── 2. Execute a signed Order ──────────────────────────────
export function useExecuteOrder() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const executeOrder = useCallback(
    (order: Order, signatures: `0x${string}`[], fromWallet: Address) => {
      const orderTuple = {
        orderType: order.orderType,
        token: order.token,
        amount: order.amount,
        recipient: order.recipient,
        nonce: order.nonce,
        deadline: order.deadline,
      };

      writeContract(
        {
          address: treasuryAddress,
          abi: TREASURY_ABI,
          functionName: "executeOrder",
          args: [orderTuple, signatures, fromWallet],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Order executed",
              message: "Treasury order has been executed on-chain",
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Execution failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  return {
    executeOrder,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// ─── 3. Build + Sign + Collect (full flow helper) ───────────
export function useOrderFlow() {
  const { address } = useAccount();
  const { signOrder, isPending: signPending } = useSignOrder();
  const { executeOrder, isPending: execPending, isSuccess, hash } = useExecuteOrder();
  const [signatures, setSignatures] = useState<`0x${string}`[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const createAndSign = useCallback(
    async (
      orderType: OrderType,
      tokenKey: "USDC" | "USDT",
      amount: string,
      decimals: number,
      recipient: Address,
      nonce: bigint
    ) => {
      const tokenAddress = TOKEN_ADDRESSES[tokenKey];
      const amountParsed = parseUnits(amount, decimals);
      const order = createOrder(orderType, tokenAddress, amountParsed, recipient, nonce);
      setCurrentOrder(order);

      const sig = await signOrder(order);
      if (sig) {
        setSignatures((prev) => [...prev, sig]);
      }
      return { order, signature: sig };
    },
    [signOrder]
  );

  const addSignature = useCallback(
    async (order: Order) => {
      const sig = await signOrder(order);
      if (sig) {
        setSignatures((prev) => [...prev, sig]);
      }
      return sig;
    },
    [signOrder]
  );

  const execute = useCallback(
    (fromWallet: Address) => {
      if (!currentOrder || signatures.length < 3) return;
      executeOrder(currentOrder, signatures, fromWallet);
    },
    [currentOrder, signatures, executeOrder]
  );

  const reset = useCallback(() => {
    setSignatures([]);
    setCurrentOrder(null);
  }, []);

  return {
    createAndSign,
    addSignature,
    execute,
    reset,
    currentOrder,
    signatures,
    signerAddress: address,
    isPending: signPending || execPending,
    isSuccess,
    hash,
    requiredSignatures: 3,
  };
}
