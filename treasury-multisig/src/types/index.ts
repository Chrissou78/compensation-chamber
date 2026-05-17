export enum ActionType {
  // Governance
  PROPOSE_THRESHOLD_CHANGE = 'propose_threshold_change',
  PROPOSE_ADD_VALIDATOR = 'propose_add_validator',
  PROPOSE_REMOVE_VALIDATOR = 'propose_remove_validator',
  PROPOSE_BLACKLIST = 'propose_blacklist',
  PROPOSE_REMOVE_BLACKLIST = 'propose_remove_blacklist',
  PROPOSE_AUTHORIZE_AGENT = 'propose_authorize_agent',
  PROPOSE_REVOKE_AGENT = 'propose_revoke_agent',
  PROPOSE_UPGRADE = 'propose_upgrade',
  PROPOSE_OWNERSHIP_TRANSFER = 'propose_ownership_transfer',

  // Direct Actions (No Governance)
  EMERGENCY_BLACKLIST = 'emergency_blacklist',
  EMERGENCY_PAUSE = 'emergency_pause',
  EMERGENCY_UNPAUSE = 'emergency_unpause',
  EMERGENCY_REFILL_GAS = 'emergency_refill_gas',

  // Voting
  VOTE_ON_PROPOSAL = 'vote_on_proposal',
  EXECUTE_PROPOSAL = 'execute_proposal',
  CANCEL_PROPOSAL = 'cancel_proposal',

  // Treasury
  WITHDRAW_MATIC = 'withdraw_matic',
  TRANSFER_OWNERSHIP = 'transfer_ownership',
}

export interface ActionConfig {
  id: ActionType;
  title: string;
  description: string;
  icon: string;
  category: 'governance' | 'voting' | 'emergency' | 'treasury';
  requiresApproval: boolean;
  cooldownSeverity?: 'EMERGENCY' | 'CRITICAL' | 'IMPORTANT' | 'ROUTINE';
  fields: FormField[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'address' | 'number' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: string;
}

export interface Proposal {
  id: string;
  createdAt: number;
  proposer: string;
  targets: string[];
  values: string[];
  calldatas: string[];
  description: string;
  severity: 'EMERGENCY' | 'CRITICAL' | 'IMPORTANT' | 'ROUTINE';
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  startBlock: number;
  endBlock: number;
  thresholdReachedAt?: number;
  readyForExecutionAt?: number;
  executed: boolean;
  cancelled: boolean;
}

export interface Validator {
  id: string;
  wallet: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'BLACKLISTED';
  votingPower: bigint;
  addedAt: number;
}

export interface ContractStatus {
  address: string;
  name: string;
  balance: bigint;
  owner: string;
  paused?: boolean;
}

export interface GasReserve {
  contract: string;
  current: bigint;
  target: bigint;
  threshold: bigint;
}
