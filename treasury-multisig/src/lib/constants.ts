import { parseAbi } from 'viem';

export const ACTIONS: Record<string, any> = {
  propose_threshold_change: {
    id: 'propose_threshold_change',
    title: 'Propose Threshold Change',
    description: 'Change signature requirement for an action type',
    icon: '⚙️',
    category: 'governance',
    requiresApproval: true,
    cooldownSeverity: 'IMPORTANT',
    fields: [
      {
        name: 'actionType',
        label: 'Action Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Payout', value: '0' },
          { label: 'Rebalance', value: '1' },
          { label: 'Staking', value: '2' },
          { label: 'Upgrade', value: '3' },
          { label: 'Minting', value: '4' },
        ],
      },
      {
        name: 'newThreshold',
        label: 'New Threshold (e.g., 3)',
        type: 'number',
        required: true,
        validation: '^[1-5]$',
      },
      {
        name: 'description',
        label: 'Reason',
        type: 'textarea',
        required: true,
      },
    ],
  },

  propose_add_validator: {
    id: 'propose_add_validator',
    title: 'Add Validator',
    description: 'Propose adding a new validator to the registry',
    icon: '➕',
    category: 'governance',
    requiresApproval: true,
    cooldownSeverity: 'ROUTINE',
    fields: [
      {
        name: 'wallet',
        label: 'Validator Wallet Address',
        type: 'address',
        required: true,
        placeholder: '0x...',
      },
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., New CEO',
      },
      {
        name: 'role',
        label: 'Role',
        type: 'text',
        required: true,
        placeholder: 'e.g., Executive',
      },
      {
        name: 'reason',
        label: 'Reason',
        type: 'textarea',
        required: true,
      },
    ],
  },

  propose_remove_validator: {
    id: 'propose_remove_validator',
    title: 'Remove Validator',
    description: 'Propose removing a validator from the registry',
    icon: '➖',
    category: 'governance',
    requiresApproval: true,
    cooldownSeverity: 'CRITICAL',
    fields: [
      {
        name: 'validatorId',
        label: 'Validator ID',
        type: 'text',
        required: true,
      },
      {
        name: 'reason',
        label: 'Reason',
        type: 'textarea',
        required: true,
      },
    ],
  },

  propose_blacklist: {
    id: 'propose_blacklist',
    title: 'Propose Blacklist',
    description: 'Propose blacklisting an address',
    icon: '🚫',
    category: 'governance',
    requiresApproval: true,
    cooldownSeverity: 'CRITICAL',
    fields: [
      {
        name: 'account',
        label: 'Address to Blacklist',
        type: 'address',
        required: true,
      },
      {
        name: 'reason',
        label: 'Reason',
        type: 'textarea',
        required: true,
      },
    ],
  },

  propose_remove_blacklist: {
    id: 'propose_remove_blacklist',
    title: 'Propose Blacklist Removal',
    description: 'Propose removing an address from blacklist',
    icon: '✅',
    category: 'governance',
    requiresApproval: true,
    cooldownSeverity: 'IMPORTANT',
    fields: [
      {
        name: 'account',
        label: 'Address to Unblacklist',
        type: 'address',
        required: true,
      },
      {
        name: 'reason',
        label: 'Reason',
        type: 'textarea',
        required: true,
      },
    ],
  },

  propose_authorize_agent: {
    id: 'propose_authorize_agent',
    title: 'Authorize AI Agent',
    description: 'Authorize an AI settlement agent',
    icon: '🤖',
    category: 'governance',
    requiresApproval: true,
    cooldownSeverity: 'ROUTINE',
    fields: [
      {
        name: 'agentAddress',
        label: 'Agent Address',
        type: 'address',
        required: true,
      },
      {
        name: 'agentName',
        label: 'Agent Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., Settlement Agent v1',
      },
      {
        name: 'reason',
        label: 'Reason',
        type: 'textarea',
        required: true,
      },
    ],
  },

  propose_revoke_agent: {
    id: 'propose_revoke_agent',
    title: 'Revoke AI Agent',
    description: 'Revoke authorization for an AI settlement agent',
    icon: '🔕',
    category: 'governance',
    requiresApproval: true,
    cooldownSeverity: 'CRITICAL',
    fields: [
      {
        name: 'agentAddress',
        label: 'Agent Address',
        type: 'address',
        required: true,
      },
      {
        name: 'reason',
        label: 'Reason',
        type: 'textarea',
        required: true,
      },
    ],
  },

  propose_upgrade: {
    id: 'propose_upgrade',
    title: 'Propose Contract Upgrade',
    description: 'Propose upgrading a contract implementation',
    icon: '🔄',
    category: 'governance',
    requiresApproval: true,
    cooldownSeverity: 'CRITICAL',
    fields: [
      {
        name: 'contractName',
        label: 'Contract to Upgrade',
        type: 'select',
        required: true,
        options: [
          { label: 'GovernanceTokenV2', value: 'governance_token' },
          { label: 'DynamicValidatorRegistry', value: 'validator_registry' },
          { label: 'TreasuryController', value: 'treasury_controller' },
          { label: 'GasRefiller', value: 'gas_refiller' },
          { label: 'UpgradeGovernor', value: 'governor' },
        ],
      },
      {
        name: 'newImplementation',
        label: 'New Implementation Address',
        type: 'address',
        required: true,
      },
      {
        name: 'reason',
        label: 'Reason for Upgrade',
        type: 'textarea',
        required: true,
      },
    ],
  },

  propose_ownership_transfer: {
    id: 'propose_ownership_transfer',
    title: 'Transfer Ownership',
    description: 'Transfer contract ownership to a new multisig',
    icon: '👑',
    category: 'treasury',
    requiresApproval: true,
    cooldownSeverity: 'CRITICAL',
    fields: [
      {
        name: 'newOwner',
        label: 'New Owner Address',
        type: 'address',
        required: true,
      },
      {
        name: 'reason',
        label: 'Reason',
        type: 'textarea',
        required: true,
      },
    ],
  },

  emergency_blacklist: {
    id: 'emergency_blacklist',
    title: '🚨 EMERGENCY: Blacklist Address',
    description: 'Immediately blacklist an address (no governance)',
    icon: '🚨',
    category: 'emergency',
    requiresApproval: false,
    fields: [
      {
        name: 'account',
        label: 'Address to Blacklist',
        type: 'address',
        required: true,
      },
      {
        name: 'reason',
        label: 'Reason (must be critical)',
        type: 'textarea',
        required: true,
      },
    ],
  },

  emergency_pause: {
    id: 'emergency_pause',
    title: '🚨 EMERGENCY: Pause Operations',
    description: 'Immediately pause all treasury operations',
    icon: '⏸️',
    category: 'emergency',
    requiresApproval: false,
    fields: [
      {
        name: 'reason',
        label: 'Reason for Emergency Pause',
        type: 'textarea',
        required: true,
      },
    ],
  },

  emergency_unpause: {
    id: 'emergency_unpause',
    title: '▶️ Resume Operations',
    description: 'Resume paused treasury operations',
    icon: '▶️',
    category: 'emergency',
    requiresApproval: true,
    cooldownSeverity: 'ROUTINE',
    fields: [
      {
        name: 'reason',
        label: 'Reason to Resume',
        type: 'textarea',
        required: true,
      },
    ],
  },

  emergency_refill_gas: {
    id: 'emergency_refill_gas',
    title: '⛽ Emergency Gas Refill',
    description: 'Manually refill contract gas reserves',
    icon: '⛽',
    category: 'emergency',
    requiresApproval: false,
    fields: [
      {
        name: 'contract',
        label: 'Contract to Refill',
        type: 'select',
        required: true,
        options: [
          { label: 'TreasuryController', value: 'treasury_controller' },
          { label: 'GasRefiller', value: 'gas_refiller' },
          { label: 'PayoutExecutor', value: 'payout_executor' },
          { label: 'RebalancingExecutor', value: 'rebalancing_executor' },
          { label: 'StakingExecutor', value: 'staking_executor' },
        ],
      },
      {
        name: 'amount',
        label: 'Amount (MATIC)',
        type: 'number',
        required: true,
        placeholder: '10',
      },
    ],
  },

  vote_on_proposal: {
    id: 'vote_on_proposal',
    title: 'Vote on Proposal',
    description: 'Cast your vote on an active proposal',
    icon: '🗳️',
    category: 'voting',
    requiresApproval: false,
    fields: [
      {
        name: 'proposalId',
        label: 'Proposal ID',
        type: 'text',
        required: true,
      },
      {
        name: 'support',
        label: 'Your Vote',
        type: 'select',
        required: true,
        options: [
          { label: 'FOR', value: '1' },
          { label: 'AGAINST', value: '0' },
          { label: 'ABSTAIN', value: '2' },
        ],
      },
      {
        name: 'reason',
        label: 'Reason (optional)',
        type: 'textarea',
        required: false,
      },
    ],
  },

  execute_proposal: {
    id: 'execute_proposal',
    title: 'Execute Proposal',
    description: 'Execute a proposal after cooldown expires',
    icon: '✓',
    category: 'voting',
    requiresApproval: false,
    fields: [
      {
        name: 'proposalId',
        label: 'Proposal ID',
        type: 'text',
        required: true,
      },
    ],
  },

  cancel_proposal: {
    id: 'cancel_proposal',
    title: 'Cancel Proposal',
    description: 'Cancel a pending proposal (multisig only)',
    icon: '❌',
    category: 'voting',
    requiresApproval: false,
    fields: [
      {
        name: 'proposalId',
        label: 'Proposal ID',
        type: 'text',
        required: true,
      },
      {
        name: 'reason',
        label: 'Reason for Cancellation',
        type: 'textarea',
        required: true,
      },
    ],
  },

  withdraw_matic: {
    id: 'withdraw_matic',
    title: 'Withdraw MATIC',
    description: 'Withdraw excess MATIC from treasury',
    icon: '💰',
    category: 'treasury',
    requiresApproval: true,
    cooldownSeverity: 'ROUTINE',
    fields: [
      {
        name: 'amount',
        label: 'Amount (MATIC)',
        type: 'number',
        required: true,
        placeholder: '10',
      },
      {
        name: 'recipient',
        label: 'Recipient Address',
        type: 'address',
        required: true,
      },
      {
        name: 'reason',
        label: 'Reason',
        type: 'textarea',
        required: true,
      },
    ],
  },

  transfer_ownership: {
    id: 'transfer_ownership',
    title: 'Direct Ownership Transfer',
    description: 'Direct ownership transfer (multisig only)',
    icon: '👑',
    category: 'treasury',
    requiresApproval: false,
    fields: [
      {
        name: 'contract',
        label: 'Contract',
        type: 'select',
        required: true,
        options: [
          { label: 'All Contracts', value: 'all' },
          { label: 'TreasuryController', value: 'treasury_controller' },
          { label: 'GasRefiller', value: 'gas_refiller' },
        ],
      },
      {
        name: 'newOwner',
        label: 'New Owner',
        type: 'address',
        required: true,
      },
    ],
  },
};

export const CONTRACT_ADDRESSES = {
  polygonAmoy: {
    variableTimelock: process.env.NEXT_PUBLIC_VARIABLE_TIMELOCK!,
    governanceToken: process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN!,
    upgradeGovernor: process.env.NEXT_PUBLIC_UPGRADE_GOVERNOR!,
    validatorRegistry: process.env.NEXT_PUBLIC_VALIDATOR_REGISTRY!,
    treasuryController: process.env.NEXT_PUBLIC_TREASURY_CONTROLLER!,
    gasRefiller: process.env.NEXT_PUBLIC_GAS_REFILLER!,
  },
};
