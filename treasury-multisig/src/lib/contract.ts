import { CONTRACT_ADDRESSES } from "./constants"

// ABI for UpgradeGovernor
export const UPGRADE_GOVERNOR_ABI = [
  {
    inputs: [
      { name: "targets", type: "address[]" },
      { name: "values", type: "uint256[]" },
      { name: "calldatas", type: "bytes[]" },
      { name: "description", type: "string" },
      { name: "severity", type: "uint8" },
    ],
    name: "proposeWithSeverity",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "vote", type: "uint8" },
    ],
    name: "castVote",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "proposalId", type: "uint256" }],
    name: "getProposalState",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "proposalId", type: "uint256" }],
    name: "proposalVotes",
    outputs: [
      { name: "againstVotes", type: "uint256" },
      { name: "forVotes", type: "uint256" },
      { name: "abstainVotes", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

// ABI for TreasuryController
export const TREASURY_CONTROLLER_ABI = [
  {
    inputs: [
      { name: "order", type: "tuple", components: [
        { name: "recipient", type: "address" },
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ]},
      { name: "signatures", type: "bytes[]" },
    ],
    name: "executeOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

// ABI for DynamicValidatorRegistry
export const VALIDATOR_REGISTRY_ABI = [
  {
    inputs: [],
    name: "getAllValidators",
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "wallet", type: "address" },
          { name: "name", type: "string" },
          { name: "status", type: "uint8" },
          { name: "votingPower", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "action", type: "uint8" }],
    name: "getThreshold",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// ABI for GasRefiller
export const GAS_REFILLER_ABI = [
  {
    inputs: [],
    name: "getGasReserves",
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "contractAddress", type: "address" },
          { name: "balance", type: "uint256" },
          { name: "target", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "target", type: "address" }],
    name: "refillGas",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const

export const getContractConfig = (contractName: string) => {
  const addressKey = contractName.toUpperCase() as keyof typeof CONTRACT_ADDRESSES
  return {
    address: CONTRACT_ADDRESSES[addressKey] as `0x${string}`,
    abi:
      contractName === "governor"
        ? UPGRADE_GOVERNOR_ABI
        : contractName === "treasury"
          ? TREASURY_CONTROLLER_ABI
          : contractName === "validators"
            ? VALIDATOR_REGISTRY_ABI
            : contractName === "gas"
              ? GAS_REFILLER_ABI
              : [],
  }
}

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
