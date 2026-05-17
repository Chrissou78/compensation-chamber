// src/lib/contract.ts
import { type Address, type Abi } from "viem";
import { CONTRACT_ADDRESSES } from "./constants";
import {
  GOVERNOR_ABI,
  TREASURY_ABI,
  REGISTRY_ABI,
  GAS_REFILLER_ABI,
} from "./abi";

type ContractName = "governor" | "treasury" | "validators" | "gas";

const CONTRACT_MAP: Record<
  ContractName,
  { addressKey: keyof typeof CONTRACT_ADDRESSES; abi: Abi }
> = {
  governor: { addressKey: "UPGRADE_GOVERNOR", abi: GOVERNOR_ABI as unknown as Abi },
  treasury: { addressKey: "TREASURY_CONTROLLER", abi: TREASURY_ABI as unknown as Abi },
  validators: { addressKey: "VALIDATOR_REGISTRY", abi: REGISTRY_ABI as unknown as Abi },
  gas: { addressKey: "GAS_REFILLER", abi: GAS_REFILLER_ABI as unknown as Abi },
};

export function getContractConfig(name: ContractName) {
  const entry = CONTRACT_MAP[name];
  return {
    address: CONTRACT_ADDRESSES[entry.addressKey] as Address,
    abi: entry.abi,
  };
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
