# Compensation Chamber

Treasury governance system for multi-country compensation management, built on Polygon with upgradeable smart contracts, multisig ownership, and on-chain governance.

---

## Architecture

The system uses a tiered ownership model:

- **Tier 1 — Master Controller:** 3-of-5 Multisig Wallet (holds all contract ownership)
- **Tier 2 — Governance Layer:** UpgradeGovernor + VariableTimelockController (gates critical changes)
- **Tier 3 — Execution Layer:** AI Agents + Authorized Signers (execute orders via EIP-712)
- **Tier 4 — Public:** Token Holders (vote in governance)

### Smart Contracts (Solidity 0.8.24)

| Contract                       | Type            | Purpose                                              |
|--------------------------------|-----------------|------------------------------------------------------|
| VariableTimelockController     | Non-upgradeable | Severity-based action delays (0h–24h)                |
| GovernanceTokenV2              | UUPS Proxy      | ERC20Votes with minting and blacklisting (1M supply) |
| DynamicValidatorRegistry       | UUPS Proxy      | Manage 3–20 validators and action thresholds         |
| TreasuryController             | UUPS Proxy      | Execute EIP-712 signed orders with 0.1% fees         |
| GasRefiller                    | UUPS Proxy      | Fee swaps via Uniswap V3, automatic gas refills      |
| PayoutExecutor                 | UUPS Proxy      | Per-country payouts with daily/monthly limits        |
| RebalancingExecutor            | UUPS Proxy      | Cross-wallet rebalancing                             |
| StakingExecutor                | UUPS Proxy      | Staking/unstaking with lock periods                  |
| UpgradeGovernor                | UUPS Proxy      | On-chain voting (7 days) with variable cooldowns     |
| TreasuryDeploymentFactory      | Non-upgradeable | Single-use bootstrap for atomic deployment           |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm

### Installation

```bash
git clone https://github.com/Chrissou78/compensation-chamber.git
cd compensation-chamber
npm install
Compile
npx hardhat compile
Test
# Run all 301 tests
npx hardhat test

# Run with coverage report
$env:COVERAGE="true"; npx hardhat coverage    # Windows PowerShell
COVERAGE=true npx hardhat coverage             # Linux/macOS
Coverage Results
Metric	Coverage
Statements	96.38%
Branches	74.81%
Functions	86.34%
Lines	98.90%
9 out of 10 production contracts at 100% line coverage. See Docs/test-coverage-report.md for the detailed breakdown.

Documentation
Document	Description
Docs/Smart-contracts.md	Full contract specifications
Docs/test-coverage-report.md	Detailed test coverage report
Docs/testing-guide.md	How to run and write tests
Docs/whitepaper.md	System whitepaper
Docs/moscow.md	MoSCoW prioritization
Docs/frontend.md	Frontend documentation
Tech Stack
Blockchain: Polygon (Amoy testnet / Mainnet)
Language: Solidity 0.8.24
Framework: Hardhat 2.28+
Proxy Pattern: OpenZeppelin UUPS (v5.6.1)
Testing: Mocha + Chai + Hardhat Ethers + solidity-coverage
Governance: OpenZeppelin Governor + TimelockController
DEX Integration: Uniswap V3 SwapRouter
Project Structure
compensation-chamber/
├── Contracts/           # Solidity source (10 production + 2 mocks)
├── test/                # Test suite (301 tests)
├── scripts/             # Deployment scripts
├── Docs/                # Documentation
├── treasury-multisig/   # Frontend workspace
├── coverage/            # Generated coverage reports
├── hardhat.config.ts    # Hardhat configuration
├── package.json         # Dependencies and workspaces
└── tsconfig.json        # TypeScript config
License
MIT


---

Create these three files:
1. **`Docs/test-coverage-report.md`** — the detailed coverage report
2. **`Docs/testing-guide.md`** — how to run and write tests
3. **`README.md`** — project overview at the repository root