import { type Abi } from "viem";

// ============================================================================
// UpgradeGovernor — Contracts/UpgradeGovernor.sol
// ============================================================================
export const GOVERNOR_ABI = [
  // ── Write ──
  { name: "proposeWithSeverity", type: "function", stateMutability: "nonpayable", inputs: [{ name: "targets", type: "address[]" }, { name: "values", type: "uint256[]" }, { name: "calldatas", type: "bytes[]" }, { name: "description", type: "string" }, { name: "severity", type: "uint8" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "castVote", type: "function", stateMutability: "nonpayable", inputs: [{ name: "proposalId", type: "uint256" }, { name: "support", type: "uint8" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "castVoteWithReason", type: "function", stateMutability: "nonpayable", inputs: [{ name: "proposalId", type: "uint256" }, { name: "support", type: "uint8" }, { name: "reason", type: "string" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "castVoteBySig", type: "function", stateMutability: "nonpayable", inputs: [{ name: "proposalId", type: "uint256" }, { name: "support", type: "uint8" }, { name: "v", type: "uint8" }, { name: "r", type: "bytes32" }, { name: "s", type: "bytes32" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "executeProposal", type: "function", stateMutability: "nonpayable", inputs: [{ name: "targets", type: "address[]" }, { name: "values", type: "uint256[]" }, { name: "calldatas", type: "bytes[]" }, { name: "descriptionHash", type: "bytes32" }, { name: "proposalId", type: "uint256" }], outputs: [] },
  { name: "cancelProposal", type: "function", stateMutability: "nonpayable", inputs: [{ name: "proposalId", type: "uint256" }], outputs: [] },
  // ── View ──
  { name: "getProposalState", type: "function", stateMutability: "view", inputs: [{ name: "proposalId", type: "uint256" }], outputs: [{ name: "", type: "tuple", components: [{ name: "severity", type: "uint8" }, { name: "thresholdReachedAt", type: "uint256" }, { name: "readyForExecutionAt", type: "uint256" }, { name: "thresholdMet", type: "bool" }, { name: "executed", type: "bool" }] }] },
  { name: "isReadyForExecution", type: "function", stateMutability: "view", inputs: [{ name: "proposalId", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "timeUntilExecutable", type: "function", stateMutability: "view", inputs: [{ name: "proposalId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "proposalVotes", type: "function", stateMutability: "view", inputs: [{ name: "proposalId", type: "uint256" }], outputs: [{ name: "againstVotes", type: "uint256" }, { name: "forVotes", type: "uint256" }, { name: "abstainVotes", type: "uint256" }] },
  { name: "state", type: "function", stateMutability: "view", inputs: [{ name: "proposalId", type: "uint256" }], outputs: [{ name: "", type: "uint8" }] },
  { name: "votingDelay", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "votingPeriod", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "proposalThreshold", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "quorum", type: "function", stateMutability: "view", inputs: [{ name: "blockNumber", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "PASSAGE_THRESHOLD", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "QUORUM_PERCENTAGE", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  // ── Events ──
  { name: "ProposalCreatedWithSeverity", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "severity", type: "uint8", indexed: true }, { name: "description", type: "string", indexed: false }] },
  { name: "ThresholdReached", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "timestamp", type: "uint256", indexed: false }, { name: "severity", type: "uint8", indexed: false }, { name: "cooldownEndsAt", type: "uint256", indexed: false }] },
  { name: "ProposalReadyForExecution", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "timestamp", type: "uint256", indexed: false }] },
  { name: "ProposalExecutedWithCooldown", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "timestamp", type: "uint256", indexed: false }] },
] as const satisfies Abi;

// ============================================================================
// TreasuryController — Contracts/TreasuryController.sol
// ============================================================================
export const TREASURY_ABI = [
  // ── Write ──
  { name: "executeOrder", type: "function", stateMutability: "nonpayable", inputs: [{ name: "order", type: "tuple", components: [{ name: "orderType", type: "uint8" }, { name: "token", type: "address" }, { name: "amount", type: "uint256" }, { name: "recipient", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] }, { name: "signatures", type: "bytes[]" }, { name: "fromWallet", type: "address" }], outputs: [{ name: "", type: "bytes32" }] },
  { name: "authorizeAgent", type: "function", stateMutability: "nonpayable", inputs: [{ name: "agent", type: "address" }], outputs: [] },
  { name: "revokeAgent", type: "function", stateMutability: "nonpayable", inputs: [{ name: "agent", type: "address" }], outputs: [] },
  { name: "addSupportedToken", type: "function", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }], outputs: [] },
  { name: "pause", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "unpause", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "setGasRefiller", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_gasRefiller", type: "address" }], outputs: [] },
  // ── View ──
  { name: "paused", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bool" }] },
  { name: "authorizedAgents", type: "function", stateMutability: "view", inputs: [{ name: "agent", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { name: "agentNonce", type: "function", stateMutability: "view", inputs: [{ name: "agent", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "executedOrders", type: "function", stateMutability: "view", inputs: [{ name: "orderId", type: "bytes32" }], outputs: [{ name: "", type: "bool" }] },
  { name: "supportedTokens", type: "function", stateMutability: "view", inputs: [{ name: "token", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { name: "gasRefiller", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { name: "DOMAIN_SEPARATOR", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bytes32" }] },
  { name: "ORDER_TYPEHASH", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bytes32" }] },
  // ── Events ──
  { name: "OrderExecuted", type: "event", inputs: [{ name: "orderId", type: "bytes32", indexed: true }, { name: "orderType", type: "uint8", indexed: true }, { name: "recipient", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }, { name: "fee", type: "uint256", indexed: false }] },
  { name: "AgentAuthorized", type: "event", inputs: [{ name: "agent", type: "address", indexed: true }] },
  { name: "AgentRevoked", type: "event", inputs: [{ name: "agent", type: "address", indexed: true }] },
  { name: "FeeCollected", type: "event", inputs: [{ name: "token", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { name: "Paused", type: "event", inputs: [] },
  { name: "Unpaused", type: "event", inputs: [] },
] as const satisfies Abi;

// ============================================================================
// DynamicValidatorRegistry — Contracts/DynamicValidatorRegistry.sol
// ============================================================================
export const REGISTRY_ABI = [
  // ── Write ──
  { name: "addValidator", type: "function", stateMutability: "nonpayable", inputs: [{ name: "wallet", type: "address" }, { name: "name", type: "string" }, { name: "role", type: "string" }], outputs: [{ name: "", type: "bytes32" }] },
  { name: "removeValidator", type: "function", stateMutability: "nonpayable", inputs: [{ name: "validatorId", type: "bytes32" }], outputs: [] },
  { name: "updateValidatorStatus", type: "function", stateMutability: "nonpayable", inputs: [{ name: "validatorId", type: "bytes32" }, { name: "newStatus", type: "uint8" }], outputs: [] },
  { name: "setActionThreshold", type: "function", stateMutability: "nonpayable", inputs: [{ name: "actionType", type: "uint8" }, { name: "requiredSignatures", type: "uint8" }, { name: "description", type: "string" }], outputs: [] },
  { name: "setMinValidators", type: "function", stateMutability: "nonpayable", inputs: [{ name: "newMin", type: "uint256" }], outputs: [] },
  { name: "setMaxValidators", type: "function", stateMutability: "nonpayable", inputs: [{ name: "newMax", type: "uint256" }], outputs: [] },
  // ── View ──
  { name: "getActiveValidators", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address[]" }] },
  { name: "getAllValidators", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "tuple[]", components: [{ name: "id", type: "bytes32" }, { name: "wallet", type: "address" }, { name: "name", type: "string" }, { name: "role", type: "string" }, { name: "status", type: "uint8" }, { name: "addedAt", type: "uint256" }, { name: "removedAt", type: "uint256" }] }] },
  { name: "getValidator", type: "function", stateMutability: "view", inputs: [{ name: "validatorId", type: "bytes32" }], outputs: [{ name: "", type: "tuple", components: [{ name: "id", type: "bytes32" }, { name: "wallet", type: "address" }, { name: "name", type: "string" }, { name: "role", type: "string" }, { name: "status", type: "uint8" }, { name: "addedAt", type: "uint256" }, { name: "removedAt", type: "uint256" }] }] },
  { name: "getValidatorByWallet", type: "function", stateMutability: "view", inputs: [{ name: "wallet", type: "address" }], outputs: [{ name: "", type: "tuple", components: [{ name: "id", type: "bytes32" }, { name: "wallet", type: "address" }, { name: "name", type: "string" }, { name: "role", type: "string" }, { name: "status", type: "uint8" }, { name: "addedAt", type: "uint256" }, { name: "removedAt", type: "uint256" }] }] },
  { name: "getRequiredSignatures", type: "function", stateMutability: "view", inputs: [{ name: "actionType", type: "uint8" }], outputs: [{ name: "", type: "uint8" }] },
  { name: "getActionThreshold", type: "function", stateMutability: "view", inputs: [{ name: "actionType", type: "uint8" }], outputs: [{ name: "", type: "tuple", components: [{ name: "id", type: "bytes32" }, { name: "actionType", type: "uint8" }, { name: "requiredSignatures", type: "uint8" }, { name: "setAt", type: "uint256" }, { name: "description", type: "string" }, { name: "active", type: "bool" }] }] },
  { name: "getActiveValidatorCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "getValidatorCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "isActiveValidator", type: "function", stateMutability: "view", inputs: [{ name: "wallet", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { name: "minValidators", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "maxValidators", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "configurationVersion", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "getConfigurationSnapshot", type: "function", stateMutability: "view", inputs: [{ name: "version", type: "uint256" }], outputs: [{ name: "", type: "tuple", components: [{ name: "timestamp", type: "uint256" }, { name: "validatorCount", type: "uint256" }, { name: "activeCount", type: "uint8" }, { name: "snapshotHash", type: "bytes32" }, { name: "version", type: "uint256" }] }] },
  { name: "getConfigurationHistory", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "tuple[]", components: [{ name: "timestamp", type: "uint256" }, { name: "validatorCount", type: "uint256" }, { name: "activeCount", type: "uint8" }, { name: "snapshotHash", type: "bytes32" }, { name: "version", type: "uint256" }] }] },
  // ── Events ──
  { name: "ValidatorAdded", type: "event", inputs: [{ name: "validatorId", type: "bytes32", indexed: true }, { name: "wallet", type: "address", indexed: true }, { name: "name", type: "string", indexed: false }, { name: "role", type: "string", indexed: false }] },
  { name: "ValidatorRemoved", type: "event", inputs: [{ name: "validatorId", type: "bytes32", indexed: true }, { name: "wallet", type: "address", indexed: true }] },
  { name: "ValidatorStatusChanged", type: "event", inputs: [{ name: "validatorId", type: "bytes32", indexed: true }, { name: "oldStatus", type: "uint8", indexed: false }, { name: "newStatus", type: "uint8", indexed: false }] },
  { name: "ThresholdUpdated", type: "event", inputs: [{ name: "actionType", type: "uint8", indexed: true }, { name: "oldRequired", type: "uint8", indexed: false }, { name: "newRequired", type: "uint8", indexed: false }] },
  { name: "ValidatorCountChanged", type: "event", inputs: [{ name: "newCount", type: "uint256", indexed: false }, { name: "maxValidators", type: "uint256", indexed: false }] },
  { name: "ConfigurationVersioned", type: "event", inputs: [{ name: "version", type: "uint256", indexed: true }, { name: "timestamp", type: "uint256", indexed: false }, { name: "snapshotHash", type: "bytes32", indexed: false }] },
] as const satisfies Abi;

// ============================================================================
// GasRefiller — Contracts/GasRefiller.sol
// ============================================================================
export const GAS_REFILLER_ABI = [
  // ── Write ──
  { name: "addManagedWallet", type: "function", stateMutability: "nonpayable", inputs: [{ name: "wallet", type: "address" }, { name: "country", type: "string" }, { name: "maxBalance", type: "uint256" }], outputs: [] },
  { name: "removeManagedWallet", type: "function", stateMutability: "nonpayable", inputs: [{ name: "wallet", type: "address" }], outputs: [] },
  { name: "registerContractGasReserve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "contract_", type: "address" }, { name: "targetMatic", type: "uint256" }, { name: "thresholdMatic", type: "uint256" }], outputs: [] },
  { name: "refillContractGas", type: "function", stateMutability: "nonpayable", inputs: [{ name: "contract_", type: "address" }, { name: "amountMatic", type: "uint256" }], outputs: [] },
  { name: "swapFeesToMatic", type: "function", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }, { name: "minMaticOut", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "receiveFees", type: "function", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { name: "withdrawMatic", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  // ── View ──
  { name: "needsRefill", type: "function", stateMutability: "view", inputs: [{ name: "contract_", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { name: "getActiveManagedWallets", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "tuple[]", components: [{ name: "wallet", type: "address" }, { name: "country", type: "string" }, { name: "maxBalance", type: "uint256" }, { name: "active", type: "bool" }] }] },
  { name: "contractGasReserves", type: "function", stateMutability: "view", inputs: [{ name: "contractAddress", type: "address" }], outputs: [{ name: "contractAddress", type: "address" }, { name: "targetMatic", type: "uint256" }, { name: "thresholdMatic", type: "uint256" }, { name: "active", type: "bool" }] },
  { name: "usdcAccumulated", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "usdtAccumulated", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "slippageTolerance", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "swapRouter", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { name: "usdc", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { name: "usdt", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { name: "wmatic", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { name: "isWalletManaged", type: "function", stateMutability: "view", inputs: [{ name: "wallet", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  // ── Events ──
  { name: "WalletAdded", type: "event", inputs: [{ name: "wallet", type: "address", indexed: true }, { name: "country", type: "string", indexed: false }, { name: "maxBalance", type: "uint256", indexed: false }] },
  { name: "WalletRemoved", type: "event", inputs: [{ name: "wallet", type: "address", indexed: true }] },
  { name: "ContractRegistered", type: "event", inputs: [{ name: "contract_", type: "address", indexed: true }, { name: "targetMatic", type: "uint256", indexed: false }, { name: "thresholdMatic", type: "uint256", indexed: false }] },
  { name: "ContractRefilled", type: "event", inputs: [{ name: "contract_", type: "address", indexed: true }, { name: "maticsReceived", type: "uint256", indexed: false }, { name: "newBalance", type: "uint256", indexed: false }] },
  { name: "FeesSwapped", type: "event", inputs: [{ name: "token", type: "address", indexed: true }, { name: "amountIn", type: "uint256", indexed: false }, { name: "maticsOut", type: "uint256", indexed: false }] },
  { name: "FeeCollected", type: "event", inputs: [{ name: "token", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { name: "BalanceRebalanced", type: "event", inputs: [{ name: "wallets", type: "address[]", indexed: false }, { name: "newBalances", type: "uint256[]", indexed: false }] },
] as const satisfies Abi;
