# Testing Guide

## Quick Start

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run all tests
npx hardhat test

# Run with coverage
$env:COVERAGE="true"; npx hardhat coverage    # Windows PowerShell
COVERAGE=true npx hardhat coverage             # Linux/macOS
Project Structure
compensation-chamber/
├── Contracts/                    # Solidity source files
│   ├── DynamicValidatorRegistry.sol
│   ├── GasRefiller.sol
│   ├── GovernanceTokenV2.sol
│   ├── MockERC20.sol             # Test helper
│   ├── MockUniswapV3Router.sol   # Test helper
│   ├── PayoutExecutor.sol
│   ├── RebalancingExecutor.sol
│   ├── StakingExecutor.sol
│   ├── TreasuryController.sol
│   ├── TreasuryDeploymentFactory.sol
│   ├── UpgradeGovernor.sol
│   └── VariableTimelockController.sol
├── test/
│   └── CompensationChamber.test.ts  # Complete test suite (301 tests)
├── coverage/                     # Generated coverage reports
│   └── index.html                # Interactive HTML report
├── Docs/
│   ├── Smart-contracts.md        # Contract specifications
│   ├── test-coverage-report.md   # Coverage report
│   ├── testing-guide.md          # This file
│   ├── whitepaper.md
│   ├── moscow.md
│   └── frontend.md
├── hardhat.config.ts
└── package.json
Test Architecture
All tests reside in a single file test/CompensationChamber.test.ts organized as follows:

Shared Fixture
The deployFullSystem fixture deploys the entire contract system behind UUPS proxies:

deployFullSystem()
├── VariableTimelockController (proxy)
├── GovernanceTokenV2 (proxy)
├── DynamicValidatorRegistry (proxy)
├── TreasuryController (proxy)
├── GasRefiller (proxy)
├── PayoutExecutor (proxy)
├── RebalancingExecutor (proxy)
├── StakingExecutor (proxy)
└── MockERC20 (USDC, USDT tokens)
Returns: { owner, recipient, validator1, validator2, validator3, timelock, govToken, registry, treasury, gasRefiller, payoutExecutor, rebalancingExecutor, stakingExecutor, usdc, usdt }

Hardhat's loadFixture caches the deployment snapshot and restores it for each test, ensuring isolation without re-deployment overhead.

Test Organization
Tests are grouped by contract in describe blocks. Each contract has a base test suite covering core functionality, plus one or more "Extended" suites covering edge cases, error paths, and advanced scenarios.

describe("VariableTimelockController")           # 20 tests
describe("DynamicValidatorRegistry")              # 16 tests
describe("DynamicValidatorRegistry – Extended")   # 12 tests
describe("TreasuryController")                    # 12 tests
describe("TreasuryController – Order Execution")  # 7 tests
describe("TreasuryController – PAYOUT Path")      # 2 tests
...etc

Writing New Tests

Adding a test to an existing suite
it("should reject zero-amount rebalance", async function () {
  const { rebalancingExecutor, owner } = await loadFixture(deployFullSystem);
  // ...setup...
  await expect(
    rebalancingExecutor.executeRebalance(/* args */)
  ).to.be.revertedWith("Invalid amount");
});

Testing EIP-712 signatures

For tests that require validator signatures (TreasuryController orders), use deterministic ethers.Wallet instances:

const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider);

// Sign an EIP-712 digest (raw, no Ethereum message prefix)
const sig = wallet.signingKey.sign(digest);
const serialized = ethers.Signature.from(sig).serialized;
Signatures must be sorted by signer address (ascending) before submission.

Testing governance flows
UpgradeGovernor tests require a full governance setup:

Deploy TimelockControllerUpgradeable as a plain contract wrapped in ERC1967Proxy (not via the upgrades plugin, since it's not UUPS-compatible).
Deploy UpgradeGovernor via upgrades.deployProxy.
Mint governance tokens and delegate to the voter.
Mine blocks past votingDelay before casting votes.
Use evm_increaseTime to fast-forward past cooldown periods.
Testing storage-dependent paths
When a mapping has no public setter (e.g., countryTokenBalance), use Hardhat's storage manipulation:

// Non-destructive slot discovery
for (let s = 0; s <= 15; s++) {
  const inner = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [addr, s])
  );
  const final_ = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(["address", "bytes32"], [token, inner])
  );
  const orig = await ethers.provider.getStorage(contractAddr, final_);
  await ethers.provider.send("hardhat_setStorageAt", [contractAddr, final_, encodedValue]);
  const val = await contract.mapping(addr, token);
  await ethers.provider.send("hardhat_setStorageAt", [contractAddr, final_, orig]); // restore
  if (val === sentinel) { foundSlot = s; break; }
}

Always save and restore the original value to avoid corrupting adjacent state.

Coverage Configuration
The solidity-coverage plugin instruments contracts with extra tracking variables, which can cause "Stack too deep" errors. The solution is to enable viaIR compilation only during coverage runs:

// hardhat.config.ts
const COVERAGE = process.env.COVERAGE === "true";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      ...(COVERAGE && { viaIR: true }),
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
};

Note: viaIR increases compilation time (2-5 minutes) and may affect stack trace accuracy. Only enable it for coverage runs.

Known Warnings
unsafeAllow: ["constructor"] — All UUPS proxy deployments emit this warning because the implementation contracts have constructor() { _disableInitializers(); }. This is correct OZ practice and safe to ignore.

viaIR not fully supported — Hardhat emits this warning when viaIR: true is set. Stack traces may be inaccurate. This only affects coverage runs.

Troubleshooting
"Stack too deep" during coverage: Enable viaIR: true in compiler settings. See Coverage Configuration above.

"COVERAGE is not defined": Ensure hardhat.config.ts reads from process.env.COVERAGE, not a bare COVERAGE variable.

Tests pass but coverage fails: Coverage instruments contracts with extra variables, which can change gas costs and storage layouts. If a specific test fails only under coverage, it may be sensitive to gas limits or exact storage positions.

"incorrect number of arguments to constructor": Check the constructor signature of the contract being deployed. MockERC20 in this project uses a parameterless constructor; other projects may differ.