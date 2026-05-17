export const GOVERNOR_ABI = [
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'description', type: 'string' },
      { name: 'severity', type: 'uint8' },
    ],
    name: 'proposeWithSeverity',
    outputs: [{ name: 'proposalId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
    ],
    name: 'castVote',
    outputs: [{ name: 'weight', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'descriptionHash', type: 'bytes32' },
      { name: 'proposalId', type: 'uint256' },
    ],
    name: 'executeProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const REGISTRY_ABI = [
  {
    inputs: [
      { name: 'wallet', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'role', type: 'string' },
    ],
    name: 'addValidator',
    outputs: [{ name: 'validatorId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getActiveValidators',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const TREASURY_ABI = [
  {
    inputs: [
      { name: 'agent', type: 'address' },
    ],
    name: 'authorizeAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
