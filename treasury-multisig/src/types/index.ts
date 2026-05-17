// src/types/index.ts

export enum ActionType {
  PROPOSE_THRESHOLD_CHANGE = "propose_threshold_change",
  PROPOSE_ADD_VALIDATOR = "propose_add_validator",
  PROPOSE_REMOVE_VALIDATOR = "propose_remove_validator",
  PROPOSE_BLACKLIST_ADDRESS = "propose_blacklist_address",
  PROPOSE_AUTHORIZE_AGENT = "propose_authorize_agent",
  PROPOSE_REVOKE_AGENT = "propose_revoke_agent",
  PROPOSE_UPDATE_DELAY = "propose_update_delay",
  PROPOSE_OWNERSHIP_TRANSFER = "propose_ownership_transfer",
  EXECUTE_PAUSE = "execute_pause",
  EXECUTE_UNPAUSE = "execute_unpause",
  EXECUTE_EMERGENCY_REFILL = "execute_emergency_refill",
  EXECUTE_WITHDRAW = "execute_withdraw",
  VIEW_PROPOSALS = "view_proposals",
  VIEW_VALIDATORS = "view_validators",
  VIEW_TREASURY_BALANCE = "view_treasury_balance",
  VIEW_GAS_RESERVES = "view_gas_reserves",
  VOTE_ON_PROPOSAL = "vote_on_proposal",
  EXECUTE_PROPOSAL = "execute_proposal",
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "address" | "number" | "select" | "textarea" | "checkbox";
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: { pattern?: RegExp; message?: string };
}

export interface ActionConfig {
  id: ActionType;
  title: string;
  description: string;
  icon: string;
  category: "governance" | "voting" | "emergency" | "treasury" | "view";
  requiresApproval: boolean;
  requiresVoting: boolean;
  fields: FormField[];
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  targets: string[];
  values: number[];
  calldatas: string[];
  startBlock: number;
  endBlock: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  canceled: boolean;
  executed: boolean;
  state:
    | "Pending"
    | "Active"
    | "Canceled"
    | "Defeated"
    | "Succeeded"
    | "Queued"
    | "Expired"
    | "Executed";
  severity?: "EMERGENCY" | "CRITICAL" | "IMPORTANT" | "ROUTINE";
  thresholdReachedAt?: number;
  readyForExecutionAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface Validator {
  address: string;
  name: string;
  status: "ACTIVE" | "BLACKLISTED";
  votingPower: number;
  joinedAt?: number;
}

export interface TreasuryBalance {
  usdc: number;
  usdt: number;
  matic: number;
  total: number;
}

export interface GasReserve {
  contractName: string;
  contractAddress: string;
  currentBalance: number;
  targetBalance: number;
  refillThreshold: number;
  lastRefillAt?: number;
}

export interface Order {
  id: string;
  orderType: "PAYOUT" | "REBALANCE" | "STAKING";
  status: "PENDING" | "SIGNED" | "EXECUTED" | "FAILED" | "CANCELED";
  createdAt: number;
  executedAt?: number;
  data: Record<string, unknown>;
}
