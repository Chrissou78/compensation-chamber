### MOSCOW ROADMAP - Treasury System

Last updated: May 2026

---

## Phase 1: MUST HAVE (Q2 2025 - 12 weeks)

# 1.1 Core Smart Contracts (Weeks 1-4)

✅ VariableTimelockController - Non-upgradeable, severity-based delays
✅ GovernanceTokenV2 - ERC20Votes with blacklisting & minting
✅ DynamicValidatorRegistry - 3-20 validators, dynamic thresholds
✅ TreasuryController - EIP-712 order execution, 0.1% fees
✅ GasRefiller - Multi-wallet, fee swaps, auto gas-refill
✅ UpgradeGovernor - Immediate execution on 3-of-5 threshold
✅ TreasuryDeploymentFactory - Atomic deployment, 4-phase rollout
✅ PayoutExecutor - Daily/monthly limits per country
✅ RebalancingExecutor - Cross-country wallet transfers
✅ StakingExecutor - Lock periods, position tracking

Deliverables:

✅ All 10 contracts written (Solidity)
✅ Full audit trail on-chain
✅ Factory deployment tested (4-phase rollout)
⬜ Deployed on Polygon Amoy testnet (pending)

# 1.2 Backend Infrastructure (Weeks 2-5)

⬜ AI Settlement Agent (Node.js/TypeScript)

Fetch payout candidates from DB
Build EIP-712 orders
Collect 3 signatures (KMS/Fireblocks)
Execute orders atomically
Log results

⬜ Gas Refiller Service

Monitor contract gas reserves
Swap fees (USDC/USDT → MATIC)
Auto-refill when below threshold
Hourly cron job

⬜ Blockchain Indexer (Subgraph)

Index all contracts
Track orders, validators, thresholds
Query ready-to-execute proposals
Real-time event logs

Deliverables:

⬜ AI agent executing 1 full payout cycle (testnet)
⬜ Gas refill automation running
⬜ Subgraph operational on Amoy

# 1.3 Multisig Wallet Interface (Weeks 4-8)
Tech Stack: Next.js 14 + TypeScript + Wagmi + Viem + Tailwind

Core Screens:

✅ Dashboard (src/app/page.tsx)
  ✅ Multisig wallet balance (MATIC)
  ✅ Pending proposals (count, oldest)
  ✅ Recent transactions (7 days)
  ✅ Gas reserve status per contract (GasChart component)
  ✅ Network status indicator

✅ Proposals Tab (src/app/proposals/)
  ✅ All proposals (pending, active, executed)
  ✅ Proposal details: targets, calldatas, severity
  ✅ Vote counts: FOR/AGAINST/ABSTAIN in real-time
  ✅ Threshold indicator (ThresholdIndicator component, 3-of-5 visual bar)
  ✅ Proposal creation wizard (multi-step: details, target, calldata, review)
  ✅ ABI builder for calldata encoding (viem parseAbiItem + encodeFunctionData)
  ✅ Vote page (src/app/proposals/[id]/vote/)
  ✅ Execute page (src/app/proposals/[id]/execute/)

✅ Governance Tab (src/app/governance/)
  ✅ Validator list (name, address, voting power)
  ✅ Action thresholds (PAYOUT, UPGRADE, etc.)
  ✅ Propose action threshold change
  ✅ Emergency: Direct blacklist/authorize agent

✅ Treasury Tab (src/app/treasury/)
  ✅ Multisig owned contracts (9 contracts)
  ✅ Quick actions: Pause, Emergency refill, Withdraw
  ✅ EIP-712 order signing (useOrderSigning hook)
  ✅ Orders page (src/app/treasury/orders/)

✅ Settings Tab (src/app/settings/)
  ✅ Network selection (Amoy, Mainnet)
  ✅ Wallet connection (Wagmi)
  ✅ Contract addresses configuration

✅ Monitoring Section (src/app/monitoring/)
  ✅ Audit log viewer (src/app/monitoring/audit/)
  ✅ Events page (src/app/monitoring/events/)
  ✅ Health page (src/app/monitoring/health/)
  ✅ Per-contract detail view (src/app/monitoring/contracts/[address]/)

Shared Components:
  ✅ Sidebar navigation
  ✅ AccessGate (role-based access control)
  ✅ ProposalCard
  ✅ CooldownTimer
  ✅ ThresholdIndicator
  ✅ AddressDisplay
  ✅ BalanceChart (Recharts)
  ✅ GasChart (Recharts)
  ✅ SupplyMeter
  ✅ EventLog
  ✅ ExportButton
  ✅ ActionForm + ActionList
  ✅ Toaster (toast notifications)
  ✅ ThemeToggle (dark/light mode)
  ✅ Skeleton loading states

Hooks:
  ✅ useMultisig
  ✅ useVoting
  ✅ useProposals
  ✅ useValidators
  ✅ useGovernance
  ✅ useAdmin
  ✅ useTreasury
  ✅ useFunds
  ✅ useEvents
  ✅ useMonitoring
  ✅ useActions
  ✅ useOrderSigning (EIP-712)
  ✅ useAccessControl

Lib:
  ✅ ABI definitions (lib/abi.ts)
  ✅ Constants: contract addresses, severity delays, subgraph queries
  ✅ EIP-712 typed data (lib/eip712.ts)
  ✅ Contract helpers (lib/contract.ts)
  ✅ Utilities (lib/utils.ts)

Deliverables:

✅ Connected to Wagmi hooks
⬜ Proposal list loading from Subgraph (hooks exist, subgraph not deployed)
✅ Sign button integrated with multisig

# 1.4 Admin Dashboard (Weeks 6-9)

✅ Admin section built (src/app/admin/)
  ✅ Overview page (total supply, validators, recent actions)
  ✅ Validators Management (src/app/admin/validators/)
  ✅ Blacklist Management (src/app/admin/blacklist/)
  ✅ Token Minting (src/app/admin/tokens/)
  ✅ Proposal creation wizard with severity selector
  ✅ Threshold visualization (ThresholdIndicator, 3-of-5 progress bar)
  ✅ Cooldown timer (CooldownTimer component)
  ✅ Execute action on proposals

Deliverables:

✅ CRUD for validators (proposal flow)
✅ Mint/blacklist request UI
✅ Proposal creation wizard

# 1.5 Funds Flow Dashboard (Weeks 7-11)
Tech Stack: Next.js 14 + TypeScript + Recharts

✅ Funds section built (src/app/funds/)
  ✅ Wallet Overview (src/app/funds/wallets/)
  ✅ Payout Tracking (src/app/funds/payouts/)
  ✅ Rebalancing History (src/app/funds/rebalancing/)
  ✅ Gas Reserve Management (src/app/funds/gas/) + GasChart
  ✅ Fee Accumulation (src/app/funds/fees/)
  ✅ BalanceChart component for fund visualization

⬜ Fund Flow Visualization (Sankey diagram, timeline, country breakdown)
⬜ Monthly settlement report (downloadable CSV)

Deliverables:

⬜ Wallets connected to indexer (indexer not deployed)
✅ Balance display components ready
✅ Charts rendering correctly (Recharts integration)

---

## Phase 2: SHOULD HAVE (Q3 2025 - 8 weeks)

# 2.1 Advanced Analytics
⬜ Cohort analysis: Payouts by country, date range
⬜ Trends: Fee accrual over time
⬜ Alerts: Daily/monthly limits near threshold (80%)
⬜ Audit reports: Monthly PDF generation
⬜ Compliance: OFAC screening logs

# 2.2 Compliance & Audit
✅ Audit log viewer: All contract events (monitoring/audit page)
⬜ Proposal replay: Show exact calldata, targets
⬜ Signature verification: Prove 3-of-5 validity
✅ Export: ExportButton component (CSV/PDF pending)

# 2.3 Multi-Chain Expansion
⬜ Deploy to Polygon Mainnet
⬜ Deploy to Ethereum (optional)
⬜ Chain selector UI
⬜ Cross-chain fund flow tracking

# 2.4 Mobile App (React Native)
⬜ Read-only dashboard
⬜ Push notifications (proposal passed, gas low)
⬜ Signature approvals (WalletConnect)

---

## Phase 3: COULD HAVE (Q4 2025 - 6 weeks)

# 3.1 Advanced Governance
⬜ Delegation UI: Validators can delegate voting power
⬜ Vote escrow: Time-weighted voting power
⬜ Snapshot voting: Off-chain voting integration

# 3.2 Risk Management
⬜ Spending limits per day/month (adjustable)
✅ Emergency pause (one-click, in actions config)
⬜ Time-locked withdrawals (VariableTimelockController exists in contracts)
⬜ Multi-step confirmations for large transfers

# 3.3 Integration APIs
⬜ REST API for order status queries
⬜ WebSocket updates for real-time events
⬜ Webhook callbacks on proposal events

---

## Summary

| Phase | Item | Status |
|-------|------|--------|
| 1.1 | Smart Contracts (10/10) | ✅ Written |
| 1.2 | Backend (Agent, Gas, Subgraph) | ⬜ Not started |
| 1.3 | Multisig Interface | ✅ Complete |
| 1.4 | Admin Dashboard | ✅ Complete |
| 1.5 | Funds Dashboard | 🔶 UI built, no live data |
| 2.x | Should Have | 🔶 Partial (audit log, export) |
| 3.x | Could Have | ⬜ Not started |

Next priorities:
1. Deploy contracts to Polygon Amoy testnet
2. Build and deploy Subgraph indexer
3. Connect frontend hooks to live contract reads
4. Build AI Settlement Agent for automated payout cycles
5. Gas Refiller service (cron-based)