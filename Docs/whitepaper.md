### WHITEPAPER - TREASURY SYSTEM v1.0

## Executive Summary

The Treasury System is a decentralized, multi-signature governance framework designed for managing on-chain treasury operations across multiple countries with crypto rails (USDC/USDT) and periodic MATIC settlements. It combines on-chain smart contracts with off-chain AI agents to automate payout processing while enforcing governance controls and operational transparency.

Key Innovation: Immediate threshold execution (3-of-5 vote) with variable cooldown periods (0h-24h) instead of fixed voting periods—enabling rapid governance response while maintaining review windows.

## 1. Problem Statement

Current Challenges

Centralized Treasury Risk: Single-signer wallets or simple multisigs lack transparent governance
Slow Governance: Fixed voting periods (7+ days) prevent timely response to emergencies
Manual Operations: Payouts, rebalancing, and gas management require manual intervention
Audit Trail Gaps: Off-chain operations difficult to audit post-facto
Multi-Country Complexity: No easy way to enforce per-country limits or allocations
Key Rotation: Compromised keys require full treasury migration

## 2. Architecture Overview

# 2.1 On-Chain Layer
9 Smart Contracts:

VariableTimelockController – Severity-based delays (0h, 4h, 12h, 24h)
GovernanceTokenV2 – 1M TGV, emergency minting, blacklisting
UpgradeGovernor – Immediate execution on 3-of-5 threshold
DynamicValidatorRegistry – 3-20 validators, dynamic thresholds
TreasuryController – EIP-712 order routing, 0.1% fee collection
GasRefiller – Multi-wallet mgmt, fee swaps, auto gas-refill
PayoutExecutor – Daily/monthly per-country limits
RebalancingExecutor – Cross-country wallet transfers
StakingExecutor – Lock periods, position tracking
Deployment: ERC1967 proxies (UUPS upgradeable), factory-deployed atomically

# 2.2 Off-Chain Layer
AI Settlement Agent (Node.js)

Fetches pending payouts from database
Builds EIP-712 orders with multisig validation
Collects 3-of-5 signatures (KMS/Fireblocks/HSM)
Executes orders atomically
Logs results to audit DB
Gas Refiller Service

Monitors contract gas reserves (10 contracts)
Swaps accumulated fees to MATIC hourly
Auto-refills when balance < threshold
Maintains min 4 MATIC per contract
Blockchain Indexer (Subgraph)

Indexes all contract events
Makes proposal status queryable
Enables real-time UI updates

# 2.3 Frontend Layer
4 Applications:

Multisig Wallet Interface – Proposal voting, signature collection
Admin Dashboard – Validator management, token minting, blacklisting
Funds Flow Dashboard – Wallet balances, payout tracking, rebalancing
Contracts Monitoring – Real-time contract status, gas levels

## 3. Governance Model

# 3.1 Immediate Threshold Execution
Traditional Model (7+ days):

Day 0: Proposal created
Days 0-7: Voting period (fixed)
Day 7: Vote ends → Proposal succeeds/fails
Day 8-9: Timelock delay
Day 9+: Execute
TOTAL: 8-9 days minimum
New Model (Threshold-based):

Day 0, Hour 0: Proposal created
Day 0, Hour 0:13: Voting begins (1 block delay)
Day 0, Hour 3: 3-of-5 vote reached → Threshold met ✓
  ├─ Severity = CRITICAL
  ├─ Cooldown = 24 hours (starts immediately)
  └─ Ready = Day 1, Hour 3
Day 1, Hour 3: Cooldown expires → Execute ✓
TOTAL: ~27 hours (vs. 8+ days)
Benefits:

✅ 70% faster governance (emergency response)
✅ No fixed voting period wastage
✅ 24h cooldown window for community review
✅ Still requires 3-of-5 majority (security maintained)

# 3.2 Severity Levels
Severity	Cooldown	Use Case	Example
EMERGENCY	0h	Critical pauses, key compromise	Blacklist compromised validator
CRITICAL	24h	Ownership transfers, major upgrades	Transfer all contracts to new multisig
IMPORTANT	12h	Parameter changes, threshold updates	Raise payout threshold 3→4
ROUTINE	4h	Validator addition, agent authorization	Add new CEO validator

# 3.3 Validator Authority
Initial Set: 5 validators (CEO, CFO, Compliance, Tech Lead, Auditor) Voting Power: 200K TGV each = 1M total circulating Thresholds:

PAYOUT: 3-of-5 (60%)
REBALANCE: 3-of-5 (60%)
STAKING: 3-of-5 (60%)
UPGRADE: 5-of-5 (100%)
MINTING: 5-of-5 (100%)
VALIDATOR_ADD: 3-of-5 (60%)
Key Property: Thresholds auto-adjust when validator count changes (maintains %)

## 4. Order Execution Model

# 4.1 EIP-712 Signed Orders
Order Structure:

struct Order {
    OrderType orderType;      // PAYOUT, REBALANCE, STAKING
    address token;            // USDC or USDT
    uint256 amount;           // Token amount
    address recipient;        // Destination
    uint256 nonce;            // Agent nonce (replay protection)
    uint256 deadline;         // Expiry timestamp
}
Signature Process:

AI agent constructs Order
Agent computes EIP-712 hash
3 validator wallets sign off-chain (KMS/Fireblocks)
Signatures sorted & deduplicated
Order + signatures sent to contract
Contract verifies 3-of-5 signatures
Order executed atomically or reverts
Gas Efficiency: Off-chain signing saves 50K+ gas per order

# 4.2 Order Types
PAYOUT

Transfer from country wallet to recipient
Applies 0.1% fee → GasRefiller
Enforces daily/monthly limits
Example: "Pay 50K USDC to wallet X (US, Feb 2025)"
REBALANCE

Transfer between country wallets
Validates source has sufficient balance
No fee (internal operation)
Example: "Move 100K USDC from US to MX"
STAKING

Send funds to staking pool
Records position with unlock time
Tracks per-country allocation %
Example: "Stake 100K MATIC for 30 days (BR)"

# 4.3 Fee Model
Structure:

Payout fee: 0.1% (deducted from amount)
Recipient gets: amount - (amount × 0.001)
Fee collected: amount × 0.001 → GasRefiller
Example:

Order amount: 50,000 USDC
Fee: 50,000 × 0.1% = 50 USDC
Recipient receives: 49,950 USDC
Treasury accrues: 50 USDC
Fee Utilization:

Accumulate USDC/USDT from payouts (daily)
Swap to MATIC hourly (Uniswap V3 0.05% tier)
Auto-refill contract gas reserves
Excess MATIC withdrawn by multisig

## 5. Multi-Country Wallet Management

# 5.1 Wallet Structure
Each Country:

1 managed wallet (e.g., 0xUS_WALLET)
Max balance limit (e.g., 1M USDC)
Target balance (e.g., 600K USDC)
Daily payout limit (e.g., 100K USDC)
Monthly payout limit (e.g., 500K USDC)
Supported Countries (Phase 1):

US: 1M USDC max, 100K daily, 500K monthly
MX: 500K USDC max, 50K daily, 250K monthly
BR: 300K USDC max, 30K daily, 150K monthly

# 5.2 Rebalancing Logic
Trigger: Manual proposal OR automated (daily check)

Algorithm:

Check each country's balance
If < target: Propose transfer from another country
If > target: Flag for rebalancing to maintain optimal distribution
Enforce max balance constraints
Log all transfers for audit
Example:

Current state:
  US: 400K USDC (target 600K)
  MX: 150K USDC (target 250K)
  BR: 80K USDC (target 150K)

Action: Rebalance 100K from US to MX
  US: 400K → 300K (still above 0, below target OK)
  MX: 150K → 250K (at target ✓)

# 5.3 Staking Allocations
Per-Country Allocation:

US: 30% of balance staked (e.g., 600K × 0.3 = 180K staked)
MX: 20% of balance staked
BR: 15% of balance staked
Lock Periods: Configurable (7/30/90 days) per country

## 6. Security Model

# 6.1 Access Control
Role	Authority	Requirements
Multisig (3-of-5)	All operations	3 signatures + cooldown
AI Agent	Execute orders	Signed by 3 validators (off-chain)
Governance Token Holder	Vote on proposals	Delegated TGV balance
Validator (signer)	Sign orders + vote	In active validator set
Public	View all state	Read-only access

# 6.2 Attack Mitigations
Compromised Validator Key → Emergency blacklist (EMERGENCY severity, 0h cooldown) → Validator tokens burned → Removed from active signers → Threshold auto-adjusted (e.g., 3-of-5 → 2-of-4)

Malicious AI Agent → Agent authorization removed via proposal → All future orders from agent rejected → Previous orders auditable (on-chain)

Replay Attack → Order nonce prevents re-execution → Order deadline prevents stale orders → Signature deduplication prevents double-signing

Flashloan Attack → Not applicable (off-chain voting, EIP-712 signed orders)

Reentrancy → ReentrancyGuard on all write functions → Atomic order execution (all-or-nothing)

## 7. Operational Workflows

# 7.1 Daily Payout Settlement
Time: 00:00 UTC daily

Steps:

Fetch Candidates (AI Agent)

Query payouts due today from DB
Group by country
Validate sufficient balance per country
Create Orders (AI Agent)

Build Order struct for each group
Compute EIP-712 hashes
Emit to signing queue
Collect Signatures (3 Validators)

Validator 1 (KMS): Sign order hash
Validator 2 (Fireblocks): Sign order hash
Validator 3 (HSM): Sign order hash
Return to AI agent
Execute Orders (AI Agent)

Call TreasuryController.executeOrder()
Verify 3 signatures
Apply 0.1% fee
Transfer net amount to recipients
Emit OrderExecuted event
Record Results (AI Agent)

Log all executed orders
Update payout status in DB
Alert on failures
Gas Cost: ~120K per order (EIP-712 verification)

# 7.2 Fee Swap Cycle
Time: Every 60 minutes

Steps:

Check Accumulation (Gas Refiller Service)

Total USDC + USDT accumulated
If > 500 USDC equivalent: proceed
Swap Fees (Gas Refiller Service)

Approve USDC/USDT to Uniswap V3 router
Call exactInputSingle(USDC → MATIC)
Slippage tolerance: 1%
Minimum output: (amount × rate × 0.99)
Auto-Refill (Gas Refiller Service)

Check each registered contract's MATIC balance
If < threshold (e.g., 3 MATIC):
Transfer from GasRefiller pool
Top up to target (e.g., 10 MATIC)
Log refill event
Report (Gas Refiller Service)

Emit FeesSwapped event
Emit ContractRefilled events
Store metrics in indexer

# 7.3 Governance: Ownership Transfer
Scenario: Compromised multisig, transfer to new 3-of-5 multisig

Time: ~27 hours

Steps:

Hour 0: Propose

Proposer: Any validator with 1K TGV
proposeWithSeverity(
  targets: [9 contracts],
  calldatas: [transferOwnership(newMultisig)] × 9,
  severity: CRITICAL
)
→ Proposal ID: 42
Hour 0-3: Vote

CEO:         votes FOR (block 1000)
CFO:         votes FOR (block 1010)
Compliance:  votes FOR (block 1020) → THRESHOLD REACHED ✓
Tech Lead:   votes ABSTAIN (block 1030)
Auditor:     votes AGAINST (block 1040)

Result: 3 FOR (60%), 1 ABSTAIN, 1 AGAINST → Proposal SUCCEEDED
Emit: ThresholdReached(42, block.timestamp, CRITICAL, +24h)
Hour 3-27: Cooldown

thresholdReachedAt = block.timestamp
readyForExecutionAt = block.timestamp + 24 hours

Community review window:
- Anyone can inspect proposal
- Multisig can cancel if needed
- Emergency procedures visible
Hour 27: Execute

Caller: Anyone (permissionless)
executeProposal(
  targets, values, calldatas,
  descriptionHash, proposalId=42
)

Actions:
1. VariableTimelockController.transferOwnership(newMultisig)
2. GovernanceTokenV2.transferOwnership(newMultisig)
3. ... (all 9 contracts)

Result: All ownership transferred atomically ✓
Old multisig loses all authority
New multisig assumes control

## 8. Risk Analysis

# 8.1 Smart Contract Risks
Risk	Mitigation	Impact
Logic bugs	Full audit + formal verification	HIGH
Reentrancy	ReentrancyGuard on all writes	MEDIUM
Integer overflow	Solidity 0.8.20 SafeMath built-in	LOW
Access control	Ownable2Step + multisig	MEDIUM
Uninitialized proxies	Factory deployment with checks	LOW

# 8.2 Operational Risks
Risk	Mitigation	Impact
Key compromise	Immediate blacklist (0h cooldown)	HIGH
AI agent malfunction	Agent authorization removal	MEDIUM
Failed swap	Retry logic, manual override	LOW
Gas spike	Reserve buffer (2 MATIC min)	LOW
Network congestion	1h+ ordering buffer	MEDIUM

# 8.3 Governance Risks
Risk	Mitigation	Impact
51% validator collusion	Monitor voting patterns	HIGH
Proposal spam	1K TGV threshold	LOW
Incorrect calldata	UI validation, multisig review	MEDIUM
Timelock bypass	On-chain delay enforcement	LOW
## 9. Compliance & Audit

# 9.1 Audit Trail
On-Chain Events:

ProposalCreatedWithSeverity
ThresholdReached
ProposalExecutedWithCooldown
OrderExecuted
FeeCollected
ContractRefilled
ValidatorAdded/Removed/Blacklisted
Off-Chain Logs:

Payout requests (DB + API logs)
Signature collection (KMS logs)
Gas refill execution (CloudWatch logs)
Agent errors (Sentry + alerts)

# 9.2 Regulatory Compliance
✅ OFAC Screening: Check recipient addresses against sanctions list
✅ KYC/AML: Payout threshold triggers KYC verification
✅ Audit Ready: All transactions queryable on-chain
✅ Multi-sig Proof: 3-of-5 signatures verifiable post-facto

# 9.3 Monthly Reports
Automated PDF Generation:

Total payouts by country
Average payout size
Fee accrual & swap history
Gas usage & refill events
Governance proposals & voting
Validator activity (sign rates)

## 10. Roadmap & Milestones

# Q2 2025 (12 weeks) - MUST HAVE
 Smart contracts (9 contracts)
 Backend: AI agent + Gas refiller service
 Frontend: Multisig wallet interface
 Frontend: Admin dashboard
 Frontend: Funds flow dashboard
 Frontend: Contracts monitoring
 Blockchain indexer (Subgraph)
 Testnet deployment (Polygon Amoy)
 Full E2E testing
 Security audit

# Q3 2025 (8 weeks) - SHOULD HAVE
 Mainnet deployment (Polygon)
 Advanced analytics dashboard
 Compliance module (OFAC, KYC)
 Mobile app (React Native)
 Multi-chain expansion

# Q4 2025 (6 weeks) - COULD HAVE
 DAO governance (Snapshot)
 Staking rewards integration
 Risk management dashboard
 API + Webhook infrastructure

## 11. Conclusion

The Treasury System provides a governance-first approach to managing multi-country crypto operations with:

✅ Speed: Threshold-based execution (3-of-5) instead of fixed voting periods ✅ Security: On-chain multisig with off-chain EIP-712 validation ✅ Transparency: All operations auditable on-chain ✅ Flexibility: Dynamic validators (3-20), auto-adjusted thresholds ✅ Compliance: OFAC screening, KYC integration, monthly audit reports ✅ Operational Excellence: Automated payout processing, gas management, fee swaps

Target Users: DAOs, crypto-native financial institutions, treasury-as-a-service platforms