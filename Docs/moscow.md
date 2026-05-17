### MOSCOW ROADMAP - Treasury System

## Phase 1: MUST HAVE (Q2 2025 - 12 weeks)

# 1.1 Core Smart Contracts (Weeks 1-4)
 VariableTimelockController - Non-upgradeable, severity-based delays
 GovernanceTokenV2 - ERC20Votes with blacklisting & minting
 DynamicValidatorRegistry - 3-20 validators, dynamic thresholds
 TreasuryController - EIP-712 order execution, 0.1% fees
 GasRefiller - Multi-wallet, fee swaps, auto gas-refill
 UpgradeGovernor - Immediate execution on 3-of-5 threshold
 TreasuryDeploymentFactory - Atomic deployment, 4-phase rollout
 PayoutExecutor - Daily/monthly limits per country
 RebalancingExecutor - Cross-country wallet transfers
 StakingExecutor - Lock periods, position tracking

Deliverables:

✅ All contracts deployed on Polygon Amoy testnet
✅ Full audit trail on-chain
✅ Factory deployment tested (4-phase rollout)

# 1.2 Backend Infrastructure (Weeks 2-5)
 AI Settlement Agent (Node.js/TypeScript)

Fetch payout candidates from DB
Build EIP-712 orders
Collect 3 signatures (KMS/Fireblocks)
Execute orders atomically
Log results
 Gas Refiller Service

Monitor contract gas reserves
Swap fees (USDC/USDT → MATIC)
Auto-refill when below threshold
Hourly cron job
 Blockchain Indexer (Subgraph)

Index all contracts
Track orders, validators, thresholds
Query ready-to-execute proposals
Real-time event logs
Deliverables:

✅ AI agent executing 1 full payout cycle (testnet)
✅ Gas refill automation running
✅ Subgraph operational on Amoy

# 1.3 Multisig Wallet Interface (Weeks 4-8)
Tech Stack: Next.js 14 + TypeScript + Wagmi + RainbowKit

Core Screens:

Dashboard

Multisig wallet balance (MATIC)
Pending proposals (count, oldest)
Recent transactions (7 days)
Gas reserve status per contract
Network status indicator
Proposals Tab

All proposals (pending, active, executed)
Proposal details: targets, calldatas, severity
Vote counts: FOR/AGAINST/ABSTAIN in real-time
Threshold indicator (3-of-5 visual bar)
Action: View details, sign, cancel
Governance Tab

Validator list (name, address, voting power)
Action thresholds (PAYOUT, UPGRADE, etc.)
Authority: Propose action threshold change
Emergency: Direct blacklist/authorize agent
Treasury Tab

Multisig owned contracts (9 contracts)
Quick actions: Pause, Emergency refill, Withdraw
Ownership transfer wizard (step-by-step)
Settings Tab

Network selection (Amoy, Mainnet)
Wallet connection (Web3Modal)
Signature method (KMS, Fireblocks, local)
Advanced: Contract addresses, ABI uploads
Deliverables:

✅ Connected to Wagmi hooks
✅ Proposal list loading from Subgraph
✅ Sign button integrated with multisig

# 1.4 Admin Dashboard (Weeks 6-9)
Tech Stack: Next.js 14 + TypeScript + Tanstack Query

Core Screens:

Overview

Total supply (TGV): 1M, minted %, remaining
Validators: Active 5/20, blacklisted 0
Recent actions: Last 10 governance events
Multisig signers: 5 names + signing status
Validators Management

Table: Wallet, Name, Role, Status, Voting Power
Actions: Add validator (gov proposal), Blacklist (emergency direct)
Blacklist history: Who, When, Reason
Token Minting

Pending mint requests: Show all
Execute: Single mint request (requires governance approval)
Cancel: Revoke pending requests
History: All executed mints
Blacklist Management

Current blacklist: Addresses, timestamps, reasons
Remove from blacklist: Propose or direct
Audit: All blacklist/unblacklist events
Proposal Management

Create proposal: EMERGENCY/CRITICAL/IMPORTANT/ROUTINE selector
Threshold visualization: 3-of-5 progress bar
Cooldown timer: Countdown to execution
Execute: One-click execution (after cooldown)
Deliverables:

✅ CRUD for validators (proposal flow)
✅ Mint/blacklist request UI
✅ Proposal creation wizard
1.5 Funds Flow Dashboard (Weeks 7-11)
Tech Stack: Next.js 14 + TypeScript + Recharts/D3.js

Core Screens:

Wallet Overview

All managed wallets (US, MX, BR)
Balance: USDC, USDT, native MATIC
Max balance limits (visual % gauge)
Target allocation (current vs. target)
Payout Tracking

Daily/monthly limits per country (visual bars)
Used vs. available today/this month
Recent payouts: 20 most recent orders
Status: Pending, Executed, Failed
Rebalancing History

Table: From, To, Amount, Date, Status
Filter by country, date range
Rebalance frequency per country
Manual rebalance trigger
Gas Reserve Management

Contract gas levels (9 contracts)
Threshold/Target indicators
Auto-refill history
Manual refill form
Fee Accumulation

USDC/USDT accumulated
Swap history: Amount swapped, MATIC received
Current swap rate (real-time)
Trigger manual swap button
Fund Flow Visualization

Sankey diagram: Inflow (deposits) → Payouts
Timeline: Historical balance over 30 days
Country breakdown: Pie chart of allocations
Monthly settlement report (downloadable CSV)
Deliverables:

✅ Wallets connected to indexer
✅ Balance displays real-time
✅ Charts rendering correctly

## Phase 2: SHOULD HAVE (Q3 2025 - 8 weeks)

# 2.1 Advanced Analytics
 Cohort analysis: Payouts by country, date range
 Trends: Fee accrual over time
 Alerts: Daily/monthly limits near threshold (80%)
 Audit reports: Monthly PDF generation
 Compliance: OFAC screening logs

# 2.2 Compliance & Audit
 Audit log viewer: All contract events
 Proposal replay: Show exact calldata, targets
 Signature verification: Prove 3-of-5 validity
 Export: Transactions, audit trail (PDF/CSV)

# 2.3 Multi-Chain Expansion
 Deploy to Polygon Mainnet
 Deploy to Ethereum (optional)
 Chain selector UI
 Cross-chain fund flow tracking

# 2.4 Mobile App (React Native)
 Read-only dashboard
 Push notifications (proposal passed, gas low)
 Signature approvals (WalletConnect)

## Phase 3: COULD HAVE (Q4 2025 - 6 weeks)

# 3.1 Advanced Governance
 Delegation UI: Validators can delegate voting power
 Vote escrow: Time-weighted voting power
 Snapshot voting: Off-chain voting integration

# 3.2 Risk Management
 Spending limits per day/month (adjustable)
 Emergency pause (one-click)
 Time-locked withdrawals
 Multi-step confirmations for large transfers

# 3.3 Integration APIs
 REST API for order status queries
 WebSocket updates for real-time events
 Webhook callbacks on proposal events