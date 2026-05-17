import { type Address } from "viem";
import { CONTRACT_ADDRESSES } from "./constants";
import {GOVERNOR_ABI, TREASURY_ABI, REGISTRY_ABI, GAS_REFILLER_ABI,} from "./abi";

type ContractName = "governor" | "treasury" | "validators" | "gas";

const CONTRACT_MAP: Record<
  ContractName,
  { addressKey: keyof typeof CONTRACT_ADDRESSES; abi: readonly unknown[] }
> = {
  governor: { addressKey: "UPGRADE_GOVERNOR", abi: GOVERNOR_ABI },
  treasury: { addressKey: "TREASURY_CONTROLLER", abi: TREASURY_ABI },
  validators: { addressKey: "VALIDATOR_REGISTRY", abi: REGISTRY_ABI },
  gas: { addressKey: "GAS_REFILLER", abi: GAS_REFILLER_ABI },
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
