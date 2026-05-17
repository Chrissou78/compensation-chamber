### FRONTEND ARCHITECTURE

## App 1: Multisig Wallet Interface

# Tech Stack

Frontend:     Next.js 14 + TypeScript
UI Library:   shadcn/ui + Tailwind CSS
Web3:         Wagmi 2.x + RainbowKit + Viem
State:        Zustand (global) + TanStack Query (server)
Charts:       Recharts
Deployment:   Vercel

# Project Structure

treasury-multisig/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (dashboard)
│   │   ├── proposals/
│   │   ├── governance/
│   │   ├── treasury/
│   │   └── settings/
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   ├── ProposalList.tsx
│   │   ├── ProposalVoting.tsx
│   │   ├── ThresholdIndicator.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useProposals.ts
│   │   ├── useVoting.ts
│   │   ├── useMultisig.ts
│   │   └── ...
│   ├── lib/
│   │   ├── contract.ts
│   │   ├── eip712.ts
│   │   └── ...
│   └── types/
│       └── index.ts
├── wagmi.config.ts
└── tailwind.config.ts

# Core Pages

1. Dashboard (/)
// Features:
- Multisig balance (MATIC)
- Pending proposals count
- Recent transactions (7 days)
- Gas reserve status (9 contracts)
- Network indicator (Amoy/Mainnet)
- Quick actions: Create proposal, Emergency pause

// Components:
- BalanceCard
- ProposalsSummary
- RecentTransactions
- GasReserveStatus
2. Proposals (/proposals)
// Features:
- List all proposals (Pending, Active, Queued, Executed)
- Filter by status, severity, date
- Real-time vote counts (FOR/AGAINST/ABSTAIN)
- Threshold progress bar (0/5 → 3/5 → Executed)
- Expand details: targets, calldatas, description
- Actions: Vote (if eligible), Cancel, Execute (if ready)

// Components:
- ProposalCard
- VoteForm
- CooldownTimer
- SignatureCollectionStatus
- ExecuteButton
3. Governance (/governance)
// Features:
- Validators list (name, address, voting power, status)
- Action thresholds (PAYOUT, UPGRADE, MINTING, etc.)
- Propose threshold change (gov proposal)
- Blacklist controls (emergency)
- Authorize/revoke AI agents

// Components:
- ValidatorTable
- ThresholdEditor
- BlacklistForm
- AgentAuthorizationForm
4. Treasury (/treasury)
// Features:
- Contract ownership status (all 9 contracts)
- Quick actions: Pause, Emergency refill, Withdraw
- Ownership transfer wizard
- Gas reserve top-up form

// Components:
- ContractCard
- PauseButton
- EmergencyRefillForm
- OwnershipTransferWizard
5. Settings (/settings)
// Features:
- Network selection (Amoy/Mainnet)
- Wallet connection (Web3Modal)
- Signature method (KMS/Fireblocks/Local)
- Contract address customization
- Theme toggle

// Components:
- NetworkSelector
- SignatureMethodSelector
- ContractAddressForm
Key Components
// ThresholdIndicator.tsx
export function ThresholdIndicator({ 
  forVotes, 
  requiredVotes = 3,
  totalVoters = 5 
}) {
  return (
    <div>
      <div className="text-sm font-semibold">
        {forVotes}/{requiredVotes} votes needed
      </div>
      <div className="w-full bg-gray-200 h-2 rounded">
        <div 
          className="bg-green-500 h-full transition-all"
          style={{ width: `${(forVotes / requiredVotes) * 100}%` }}
        />
      </div>
      {forVotes >= requiredVotes && (
        <span className="text-sm text-green-600 font-bold">
          ✓ Threshold reached!
        </span>
      )}
    </div>
  );
}

## App 2: Admin Dashboard

# Tech Stack

Frontend:     Next.js 14 + TypeScript
UI Library:   shadcn/ui + Tailwind CSS
Web3:         Wagmi 2.x + Ethers.js
State:        Zustand
Data Fetch:   TanStack Query
Tables:       TanStack Table (React Table)
Deployment:   Vercel

# Project Structure

treasury-admin/
├── src/
│   ├── app/
│   │   ├── page.tsx (overview)
│   │   ├── validators/
│   │   ├── tokens/
│   │   ├── blacklist/
│   │   ├── proposals/
│   │   └── settings/
│   ├── components/
│   │   ├── ValidatorTable.tsx
│   │   ├── MintRequestForm.tsx
│   │   ├── BlacklistForm.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useValidators.ts
│   │   ├── useMintRequests.ts
│   │   └── ...
│   └── lib/
│       └── admin.ts
└── env.local

# Core Pages

1. Overview
// Features:
- Total TGV minted vs. max supply (1M)
- Validators: Active 5/20, Blacklisted 0
- Recent governance events (10 most recent)
- Multisig signers + signing status

// Components:
- SupplyMeter
- ValidatorSummary
- EventTimeline
2. Validators Management (/validators)
// Features:
- Table: Wallet, Name, Role, Status, Voting Power
- Add validator (governance proposal form)
- Blacklist validator (emergency direct call)
- Blacklist history with timestamps

// Components:
- ValidatorTable (sortable, filterable)
- AddValidatorForm
- BlacklistValidatorForm
- BlacklistHistory
3. Token Minting (/tokens)
// Features:
- Pending mint requests: Show all
- Execute: Single mint request (requires gov approval)
- Cancel: Revoke pending requests
- History: All executed mints (pagination)

// Components:
- PendingMintTable
- ExecuteMintForm
- MintHistoryTable
4. Blacklist Management (/blacklist)
// Features:
- Current blacklist: Addresses, timestamps, reasons
- Remove from blacklist: Propose or direct
- Audit: All blacklist/unblacklist events
- Search + filter

// Components:
- BlacklistTable
- RemoveBlacklistForm
- AuditLog
5. Proposal Management (/proposals)
// Features:
- Create proposal: EMERGENCY/CRITICAL/IMPORTANT/ROUTINE selector
- Threshold visualization: 3-of-5 progress bar
- Cooldown timer: Countdown to execution
- Execute: One-click execution (after cooldown)
- Proposal history

// Components:
- ProposalCreator
- ProposalCard
- CooldownTimer
- ExecutionButton

## App 3: Funds Flow Dashboard

# Tech Stack

Frontend:     Next.js 14 + TypeScript
UI Library:   shadcn/ui + Tailwind CSS
Charts:       Recharts + D3.js
Data:         TanStack Query (from Subgraph)
Export:       papaparse (CSV), jsPDF
Deployment:   Vercel

# Project Structure

treasury-funds/
├── src/
│   ├── app/
│   │   ├── page.tsx (overview)
│   │   ├── wallets/
│   │   ├── payouts/
│   │   ├── rebalancing/
│   │   ├── gas-reserves/
│   │   ├── fees/
│   │   └── reports/
│   ├── components/
│   │   ├── WalletOverview.tsx
│   │   ├── PayoutChart.tsx
│   │   ├── SankeyDiagram.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useWallets.ts
│   │   ├── usePayouts.ts
│   │   └── ...
│   └── lib/
│       ├── subgraph.ts
│       └── export.ts
└── env.local

# Core Pages

1. Overview
// Features:
- Total treasury value (USDC + USDT + MATIC)
- Breakdown by country (pie chart)
- Monthly settlement report preview
- Last 7 days activity summary

// Components:
- TotalValueCard
- BreakdownChart
- ActivitySummary
2. Wallet Overview (/wallets)
// Features:
- All managed wallets (US, MX, BR)
- Balance: USDC, USDT, native MATIC
- Max balance limits (visual % gauge)
- Target allocation (current vs. target)
- Actions: Manual rebalance trigger

// Components:
- WalletCard
- BalanceGauge
- ManualRebalanceForm
3. Payout Tracking (/payouts)
// Features:
- Daily/monthly limits per country (visual bars)
- Used vs. available today/this month
- Recent payouts: 20 most recent orders
- Status: Pending, Executed, Failed
- Filter by country, date range

// Components:
- LimitProgressBar
- PayoutTable
- DateRangeFilter
- StatusBadge
4. Rebalancing History (/rebalancing)
// Features:
- Table: From, To, Amount, Date, Status
- Filter by country, date range
- Rebalance frequency per country
- Manual rebalance trigger

// Components:
- RebalanceTable
- RebalanceForm
- FrequencySelector
5. Gas Reserve Management (/gas-reserves)
// Features:
- Contract gas levels (9 contracts)
- Threshold/Target indicators
- Auto-refill history (last 10)
- Manual refill form

// Components:
- GasReserveCard
- ManualRefillForm
- AutoRefillHistory
6. Fee Accumulation (/fees)
// Features:
- USDC/USDT accumulated (real-time)
- Swap history: Amount swapped, MATIC received
- Current swap rate (Uniswap V3)
- Trigger manual swap button

// Components:
- AccumulationCard
- SwapHistoryTable
- ManualSwapForm
- SwapRateDisplay
7. Fund Flow Visualization
// Features:
- Sankey diagram: Inflow → Payouts
- Timeline: Balance over 30 days
- Country breakdown: Pie chart
- Monthly settlement report (downloadable CSV)

// Components:
- SankeyDiagram
- TimelineChart
- CountryBreakdown
- ReportExporter

## App 4: Contracts Monitoring

# Tech Stack
Frontend:     Next.js 14 + TypeScript
UI Library:   shadcn/ui + Tailwind CSS
Charts:       Recharts
Real-time:    WebSocket (Subgraph subscriptions)
Status:       Uptime tracking
Deployment:   Vercel

# Project Structure

treasury-contracts/
├── src/
│   ├── app/
│   │   ├── page.tsx (dashboard)
│   │   ├── contracts/
│   │   ├── events/
│   │   └── health/
│   ├── components/
│   │   ├── ContractCard.tsx
│   │   ├── EventLog.tsx
│   │   ├── HealthStatus.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useContractStatus.ts
│   │   ├── useEvents.ts
│   │   └── ...
│   └── lib/
│       └── monitoring.ts
└── env.local

# Core Pages

1. Dashboard
// Features:
- Status of all 9 contracts (green/yellow/red)
- Total gas across all contracts
- Event count (24h)
- Last update timestamp

// Components:
- StatusGrid (9 contract cards)
- GasMetricsCard
- EventCounter
- UpdateTimestamp
2. Contract Details (/contracts/[id])
// Features:
- Contract info (address, balance, owner)
- Recent events (100 most recent)
- Gas usage trend (7 days)
- Upgrade history
- Pause status

// Components:
- ContractHeader
- EventLog (sortable, filterable)
- GasUsageChart
- UpgradeHistory
- PauseStatus
3. Event Log (/events)
// Features:
- All contract events (real-time)
- Filter by contract, event type, date
- Export to CSV
- Search by transaction hash

// Components:
- EventTable
- FilterForm
- SearchBox
- ExportButton
4. Health Check (/health)
// Features:
- Contract uptime (%)
- Response times (ms)
- Error count (24h)
- Alerts configuration

// Components:
- UptimeChart
- ResponseTimeChart
- AlertsList
- AlertConfiguration
Shared Infrastructure
GraphQL Subgraph (The Graph)

# Queries:

type Query {
  proposals(first: 10, orderBy: createdAt_desc): [Proposal!]!
  proposal(id: ID!): Proposal
  validators(active: Boolean): [Validator!]!
  orders(status: OrderStatus): [Order!]!
  wallets(country: String): [Wallet!]!
  events(contract: String, first: 100): [Event!]!
}

# Subscriptions:
type Subscription {
  proposalUpdated: Proposal
  orderExecuted: Order
  eventEmitted: Event
}

## API Layer (Optional REST)

// GET /api/proposals?status=ACTIVE
// POST /api/proposals - Create proposal
// GET /api/validators
// GET /api/wallets?country=US
// GET /api/orders?status=EXECUTED
// GET /api/events?contract=TreasuryController
// POST /api/export/report - Generate monthly PDF

# Authentication & Authorization

// Middleware:
- Verify wallet signature (SIWE - Sign In With Ethereum)
- Check if wallet is multisig owner/validator
- Rate limit API calls
- Log all admin actions

# Deployment Pipeline

.github/workflows/deploy.yml

- name: Build & Deploy (Multisig)
  run: |
    cd treasury-multisig
    npm ci
    npm run build
    vercel deploy --prod

- name: Build & Deploy (Admin)
  run: |
    cd treasury-admin
    npm ci
    npm run build
    vercel deploy --prod

- name: Build & Deploy (Funds)
  run: |
    cd treasury-funds
    npm ci
    npm run build
    vercel deploy --prod

- name: Build & Deploy (Contracts)
  run: |
    cd treasury-contracts
    npm ci
    npm run build
    vercel deploy --prod