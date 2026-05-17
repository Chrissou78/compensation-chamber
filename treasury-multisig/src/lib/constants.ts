import { ActionType, ActionConfig } from "@/types"

export const ACTIONS_CONFIG: Record<ActionType, ActionConfig> = {
  [ActionType.PROPOSE_THRESHOLD_CHANGE]: {
    id: ActionType.PROPOSE_THRESHOLD_CHANGE,
    title: "Change Signature Threshold",
    description: "Modify the required number of signatures for actions",
    icon: "⚙️",
    category: "governance",
    requiresApproval: true,
    requiresVoting: true,
    fields: [
      {
        name: "actionType",
        label: "Action Type",
        type: "select",
        required: true,
        options: [
          { label: "Payout", value: "PAYOUT" },
          { label: "Rebalance", value: "REBALANCE" },
          { label: "Staking", value: "STAKING" },
          { label: "Upgrade", value: "UPGRADE" },
          { label: "Minting", value: "MINTING" },
        ],
      },
      {
        name: "newThreshold",
        label: "New Threshold (1-5)",
        type: "number",
        required: true,
        placeholder: "e.g., 3",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        placeholder: "Why is this change needed?",
      },
    ],
  },

  [ActionType.PROPOSE_ADD_VALIDATOR]: {
    id: ActionType.PROPOSE_ADD_VALIDATOR,
    title: "Add Validator",
    description: "Add a new member to the validator set",
    icon: "👤",
    category: "governance",
    requiresApproval: true,
    requiresVoting: true,
    fields: [
      {
        name: "validatorAddress",
        label: "Validator Address",
        type: "address",
        required: true,
        placeholder: "0x...",
      },
      {
        name: "validatorName",
        label: "Validator Name",
        type: "text",
        required: true,
        placeholder: "e.g., CEO",
      },
      {
        name: "votingPower",
        label: "Voting Power (TGV)",
        type: "number",
        required: true,
        placeholder: "200000",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        placeholder: "Background and rationale",
      },
    ],
  },

  [ActionType.PROPOSE_REMOVE_VALIDATOR]: {
    id: ActionType.PROPOSE_REMOVE_VALIDATOR,
    title: "Remove Validator",
    description: "Remove a member from the validator set",
    icon: "🚫",
    category: "governance",
    requiresApproval: true,
    requiresVoting: true,
    fields: [
      {
        name: "validatorAddress",
        label: "Validator Address",
        type: "address",
        required: true,
        placeholder: "0x...",
      },
      {
        name: "reason",
        label: "Reason for Removal",
        type: "textarea",
        required: true,
        placeholder: "Why should this validator be removed?",
      },
    ],
  },

  [ActionType.PROPOSE_BLACKLIST_ADDRESS]: {
    id: ActionType.PROPOSE_BLACKLIST_ADDRESS,
    title: "Blacklist Address",
    description: "Blacklist an address from receiving or holding TGV tokens",
    icon: "⛔",
    category: "emergency",
    requiresApproval: true,
    requiresVoting: false,
    fields: [
      {
        name: "accountAddress",
        label: "Account to Blacklist",
        type: "address",
        required: true,
        placeholder: "0x...",
      },
      {
        name: "reason",
        label: "Reason",
        type: "textarea",
        required: true,
        placeholder: "Security incident, regulatory, etc.",
      },
    ],
  },

  [ActionType.PROPOSE_AUTHORIZE_AGENT]: {
    id: ActionType.PROPOSE_AUTHORIZE_AGENT,
    title: "Authorize AI Agent",
    description: "Authorize an AI settlement agent to execute treasury orders",
    icon: "🤖",
    category: "governance",
    requiresApproval: true,
    requiresVoting: true,
    fields: [
      {
        name: "agentAddress",
        label: "Agent Address",
        type: "address",
        required: true,
        placeholder: "0x...",
      },
      {
        name: "agentName",
        label: "Agent Name",
        type: "text",
        required: true,
        placeholder: "e.g., Settlement Agent v1",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        placeholder: "Agent capabilities and scope",
      },
    ],
  },

  [ActionType.PROPOSE_REVOKE_AGENT]: {
    id: ActionType.PROPOSE_REVOKE_AGENT,
    title: "Revoke AI Agent",
    description: "Revoke authorization from an AI settlement agent",
    icon: "🔐",
    category: "governance",
    requiresApproval: true,
    requiresVoting: true,
    fields: [
      {
        name: "agentAddress",
        label: "Agent Address",
        type: "address",
        required: true,
        placeholder: "0x...",
      },
      {
        name: "reason",
        label: "Reason for Revocation",
        type: "textarea",
        required: true,
        placeholder: "Why is the agent being revoked?",
      },
    ],
  },

  [ActionType.PROPOSE_UPDATE_DELAY]: {
    id: ActionType.PROPOSE_UPDATE_DELAY,
    title: "Update Timelock Delay",
    description: "Modify the timelock delay for an action severity level",
    icon: "⏱️",
    category: "governance",
    requiresApproval: true,
    requiresVoting: true,
    fields: [
      {
        name: "severity",
        label: "Severity Level",
        type: "select",
        required: true,
        options: [
          { label: "Emergency (0h)", value: "EMERGENCY" },
          { label: "Critical (24h)", value: "CRITICAL" },
          { label: "Important (12h)", value: "IMPORTANT" },
          { label: "Routine (4h)", value: "ROUTINE" },
        ],
      },
      {
        name: "newDelay",
        label: "New Delay (seconds)",
        type: "number",
        required: true,
        placeholder: "86400",
      },
      {
        name: "description",
        label: "Reason for Change",
        type: "textarea",
        required: true,
      },
    ],
  },

  [ActionType.PROPOSE_OWNERSHIP_TRANSFER]: {
    id: ActionType.PROPOSE_OWNERSHIP_TRANSFER,
    title: "Transfer Ownership",
    description: "Transfer all treasury contracts to a new multisig",
    icon: "👑",
    category: "governance",
    requiresApproval: true,
    requiresVoting: true,
    fields: [
      {
        name: "newOwner",
        label: "New Multisig Address",
        type: "address",
        required: true,
        placeholder: "0x...",
      },
      {
        name: "newMembers",
        label: "New Member Addresses (comma-separated)",
        type: "textarea",
        required: true,
        placeholder: "0x..., 0x..., 0x..., 0x..., 0x...",
      },
      {
        name: "description",
        label: "Reason for Transfer",
        type: "textarea",
        required: true,
        placeholder: "New governance structure, security upgrade, etc.",
      },
    ],
  },

  [ActionType.EXECUTE_PAUSE]: {
    id: ActionType.EXECUTE_PAUSE,
    title: "Pause Treasury Operations",
    description: "Immediately pause all treasury operations (emergency)",
    icon: "⏸️",
    category: "emergency",
    requiresApproval: true,
    requiresVoting: false,
    fields: [
      {
        name: "reason",
        label: "Reason for Pause",
        type: "textarea",
        required: true,
        placeholder: "Security incident, system upgrade, etc.",
      },
    ],
  },

  [ActionType.EXECUTE_UNPAUSE]: {
    id: ActionType.EXECUTE_UNPAUSE,
    title: "Unpause Treasury Operations",
    description: "Resume all treasury operations after pause",
    icon: "▶️",
    category: "governance",
    requiresApproval: true,
    requiresVoting: false,
    fields: [
      {
        name: "description",
        label: "Confirmation Message",
        type: "textarea",
        required: true,
        placeholder: "All systems checked and ready to resume",
      },
    ],
  },

  [ActionType.EXECUTE_EMERGENCY_REFILL]: {
    id: ActionType.EXECUTE_EMERGENCY_REFILL,
    title: "Emergency Gas Refill",
    description: "Immediately refill gas reserves for critical contracts",
    icon: "⛽",
    category: "emergency",
    requiresApproval: true,
    requiresVoting: false,
    fields: [
      {
        name: "contract",
        label: "Contract to Refill",
        type: "select",
        required: true,
        options: [
          { label: "Treasury Controller", value: "TREASURY_CONTROLLER" },
          { label: "Payout Executor", value: "PAYOUT_EXECUTOR" },
          { label: "Rebalancing Executor", value: "REBALANCING_EXECUTOR" },
          { label: "Staking Executor", value: "STAKING_EXECUTOR" },
        ],
      },
      {
        name: "amount",
        label: "Amount (MATIC)",
        type: "number",
        required: true,
        placeholder: "10",
      },
    ],
  },

  [ActionType.EXECUTE_WITHDRAW]: {
    id: ActionType.EXECUTE_WITHDRAW,
    title: "Emergency Withdraw",
    description: "Withdraw funds from treasury to a specified address",
    icon: "💸",
    category: "emergency",
    requiresApproval: true,
    requiresVoting: false,
    fields: [
      {
        name: "token",
        label: "Token",
        type: "select",
        required: true,
        options: [
          { label: "USDC", value: "USDC" },
          { label: "USDT", value: "USDT" },
          { label: "MATIC", value: "MATIC" },
        ],
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "1000",
      },
      {
        name: "recipient",
        label: "Recipient Address",
        type: "address",
        required: true,
        placeholder: "0x...",
      },
      {
        name: "reason",
        label: "Reason",
        type: "textarea",
        required: true,
      },
    ],
  },

  [ActionType.VIEW_PROPOSALS]: {
    id: ActionType.VIEW_PROPOSALS,
    title: "View Proposals",
    description: "View all governance proposals and their status",
    icon: "📋",
    category: "view",
    requiresApproval: false,
    requiresVoting: false,
    fields: [],
  },

  [ActionType.VIEW_VALIDATORS]: {
    id: ActionType.VIEW_VALIDATORS,
    title: "View Validators",
    description: "View all active validators and their voting power",
    icon: "👥",
    category: "view",
    requiresApproval: false,
    requiresVoting: false,
    fields: [],
  },

  [ActionType.VIEW_TREASURY_BALANCE]: {
    id: ActionType.VIEW_TREASURY_BALANCE,
    title: "View Treasury Balance",
    description: "Check total treasury funds across all tokens",
    icon: "💰",
    category: "view",
    requiresApproval: false,
    requiresVoting: false,
    fields: [],
  },

  [ActionType.VIEW_GAS_RESERVES]: {
    id: ActionType.VIEW_GAS_RESERVES,
    title: "View Gas Reserves",
    description: "Check gas reserves for each contract",
    icon: "📊",
    category: "view",
    requiresApproval: false,
    requiresVoting: false,
    fields: [],
  },

  [ActionType.VOTE_ON_PROPOSAL]: {
    id: ActionType.VOTE_ON_PROPOSAL,
    title: "Vote on Proposal",
    description: "Cast your vote on an active governance proposal",
    icon: "🗳️",
    category: "voting",
    requiresApproval: false,
    requiresVoting: false,
    fields: [
      {
        name: "proposalId",
        label: "Proposal ID",
        type: "text",
        required: true,
        placeholder: "e.g., 42",
      },
      {
        name: "vote",
        label: "Your Vote",
        type: "select",
        required: true,
        options: [
          { label: "For", value: "1" },
          { label: "Against", value: "0" },
          { label: "Abstain", value: "2" },
        ],
      },
      {
        name: "reason",
        label: "Voting Reason (optional)",
        type: "textarea",
        required: false,
        placeholder: "Why are you voting this way?",
      },
    ],
  },

  [ActionType.EXECUTE_PROPOSAL]: {
    id: ActionType.EXECUTE_PROPOSAL,
    title: "Execute Proposal",
    description: "Execute a proposal that has met threshold and cooldown",
    icon: "✅",
    category: "voting",
    requiresApproval: false,
    requiresVoting: false,
    fields: [
      {
        name: "proposalId",
        label: "Proposal ID",
        type: "text",
        required: true,
        placeholder: "e.g., 42",
      },
      {
        name: "confirmation",
        label: "I confirm this proposal is ready for execution",
        type: "checkbox",
        required: true,
      },
    ],
  },
}

export const CONTRACT_ADDRESSES = {
  VARIABLE_TIMELOCK: process.env.NEXT_PUBLIC_VARIABLE_TIMELOCK || "0x",
  GOVERNANCE_TOKEN: process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN || "0x",
  UPGRADE_GOVERNOR: process.env.NEXT_PUBLIC_UPGRADE_GOVERNOR || "0x",
  VALIDATOR_REGISTRY: process.env.NEXT_PUBLIC_VALIDATOR_REGISTRY || "0x",
  TREASURY_CONTROLLER: process.env.NEXT_PUBLIC_TREASURY_CONTROLLER || "0x",
  GAS_REFILLER: process.env.NEXT_PUBLIC_GAS_REFILLER || "0x",
}

export const NETWORKS = {
  AMOY: 80002,
  POLYGON: 137,
  ETHEREUM: 1,
}

export const CATEGORY_LABELS: Record<string, string> = {
  governance: "🏛️ Governance",
  voting: "🗳️ Voting",
  emergency: "🚨 Emergency",
  treasury: "💎 Treasury",
  view: "👁️ View",
}

export const CATEGORY_COLORS: Record<string, string> = {
  governance: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  voting: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  emergency: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  treasury: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  view: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
}

export const PROPOSAL_STATES = [
  "Pending",
  "Active",
  "Canceled",
  "Defeated",
  "Succeeded",
  "Queued",
  "Expired",
  "Executed",
] as const

export const SEVERITY_DELAYS = {
  EMERGENCY: 0,
  CRITICAL: 86400, // 24 hours
  IMPORTANT: 43200, // 12 hours
  ROUTINE: 14400, // 4 hours
}

export const REQUIRED_THRESHOLD = 3
export const TOTAL_VALIDATORS = 5
export const MAX_VALIDATORS = 20
export const MIN_VALIDATORS = 3

export const SUBGRAPH_QUERY = {
  GET_PROPOSALS: `
    query GetProposals($first: Int!, $skip: Int!) {
      proposals(first: $first, skip: $skip, orderBy: createdAt, orderDirection: desc) {
        id
        title
        description
        state
        severity
        forVotes
        againstVotes
        abstainVotes
        createdAt
        thresholdReachedAt
        readyForExecutionAt
      }
    }
  `,
  GET_VALIDATORS: `
    query GetValidators {
      validators(where: { status: ACTIVE }) {
        id
        address
        name
        votingPower
        status
      }
    }
  `,
  GET_TREASURY_BALANCE: `
    query GetTreasuryBalance {
      treasuryBalances(first: 1) {
        usdc
        usdt
        matic
      }
    }
  `,
}

export const TOKEN_ADDRESSES = {
  USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0xEd589B57e559874A5202a0FB82406c46A2116675") as `0x${string}`,
  USDT: (process.env.NEXT_PUBLIC_USDT_ADDRESS || "0xfa86C7c30840694293a5c997f399d00A4eD3cDD8") as `0x${string}`,
} as const;