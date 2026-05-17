import { type Address } from "viem";

export const EIP712_DOMAIN = {
  name: "TreasuryController",
  version: "1",
  // chainId will be set dynamically
  // verifyingContract will be set from CONTRACT_ADDRESSES
} as const;

export const ORDER_TYPES = {
  Order: [
    { name: "orderType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "recipient", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export enum OrderType {
  PAYOUT = 0,
  REBALANCE = 1,
  STAKING = 2,
}

export interface Order {
  orderType: OrderType;
  token: Address;
  amount: bigint;
  recipient: Address;
  nonce: bigint;
  deadline: bigint;
}

export function buildOrderMessage(order: Order) {
  return {
    orderType: order.orderType,
    token: order.token,
    amount: order.amount,
    recipient: order.recipient,
    nonce: order.nonce,
    deadline: order.deadline,
  };
}

export function buildDomain(chainId: number, verifyingContract: Address) {
  return {
    ...EIP712_DOMAIN,
    chainId,
    verifyingContract,
  };
}

/**
 * Build the full EIP-712 typed data structure for signing with wagmi/viem.
 * Usage with useSignTypedData:
 *
 * const typedData = getOrderTypedData(chainId, contractAddress, order);
 * signTypedData(typedData);
 */
export function getOrderTypedData(
  chainId: number,
  verifyingContract: Address,
  order: Order
) {
  return {
    domain: buildDomain(chainId, verifyingContract),
    types: ORDER_TYPES,
    primaryType: "Order" as const,
    message: buildOrderMessage(order),
  };
}

/**
 * Create an order with a 1-hour deadline from now.
 */
export function createOrder(
  orderType: OrderType,
  token: Address,
  amount: bigint,
  recipient: Address,
  nonce: bigint,
  deadlineSeconds = 3600
): Order {
  return {
    orderType,
    token,
    amount,
    recipient,
    nonce,
    deadline: BigInt(Math.floor(Date.now() / 1000) + deadlineSeconds),
  };
}
