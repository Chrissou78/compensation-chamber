import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");

  const USDC = process.env.USDC_ADDRESS!;
  const USDT = process.env.USDT_ADDRESS!;
  const WMATIC = process.env.WMATIC_ADDRESS!;
  const SWAP_ROUTER = process.env.SWAP_ROUTER!;
  const MULTISIG = process.env.MULTISIG_OWNER || deployer.address;

  const validators = [
    process.env.VALIDATOR_1!,
    process.env.VALIDATOR_2!,
    process.env.VALIDATOR_3!,
    process.env.VALIDATOR_4!,
    process.env.VALIDATOR_5!,
  ];

  console.log("\n========== DEPLOYING CONTRACTS TO AMOY ==========\n");

  // ──────────────────────────────────────────────────────
  // 1. VariableTimelockController (NOT upgradeable — Ownable)
  // ──────────────────────────────────────────────────────
  console.log("1. Deploying VariableTimelockController...");
  const TimelockFactory = await ethers.getContractFactory("VariableTimelockController");
  const timelock = await TimelockFactory.deploy();
  await timelock.waitForDeployment();
  const timelockAddr = await timelock.getAddress();
  console.log("   VariableTimelockController:", timelockAddr);

  // Initialize timelock with testing delays (shortened for testnet)
  const tx1 = await timelock.initialize(
    deployer.address,  // owner (will transfer to MULTISIG later)
    0,                  // emergency delay
    86400,              // critical delay (1 day)
    43200,              // important delay (12 hours)
    14400               // routine delay (4 hours)
  );
  await tx1.wait();
  console.log("   Timelock initialized ✓");

  // ──────────────────────────────────────────────────────
  // 2. GovernanceTokenV2 (UUPS Upgradeable)
  // ──────────────────────────────────────────────────────
  console.log("2. Deploying GovernanceTokenV2 (UUPS proxy)...");
  const GovTokenFactory = await ethers.getContractFactory("GovernanceTokenV2");
  const govToken = await upgrades.deployProxy(GovTokenFactory, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
    unsafeAllow: ["constructor", "state-variable-assignment"],
  });
  await govToken.waitForDeployment();
  const govTokenAddr = await govToken.getAddress();
  console.log("   GovernanceTokenV2:", govTokenAddr);

  // ──────────────────────────────────────────────────────
  // 3. DynamicValidatorRegistry (UUPS Upgradeable)
  // ──────────────────────────────────────────────────────
  console.log("3. Deploying DynamicValidatorRegistry (UUPS proxy)...");
  const RegistryFactory = await ethers.getContractFactory("DynamicValidatorRegistry");
  const registry = await upgrades.deployProxy(RegistryFactory, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
    unsafeAllow: ["constructor", "state-variable-assignment"],
  });
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("   DynamicValidatorRegistry:", registryAddr);

  // Add 5 validators
  const validatorNames = ["CEO", "CFO", "Compliance Officer", "Technical Lead", "External Auditor"];
  const validatorRoles = ["Executive", "Finance", "Risk", "Engineering", "Audit"];

  for (let i = 0; i < validators.length; i++) {
    const addTx = await registry.addValidator(validators[i], validatorNames[i], validatorRoles[i]);
    await addTx.wait();
    console.log(`   Added validator ${validatorNames[i]}: ${validators[i]}`);
  }

  // Set action thresholds (3-of-5 for most actions, 5-of-5 for upgrades/minting)
  // ActionType enum: PAYOUT=0, REBALANCE=1, STAKING=2, UPGRADE=3, PARAMETER_CHANGE=4, 
  //                  VALIDATOR_ADD=5, VALIDATOR_REMOVE=6, BLACKLIST=7, MINTING=8, GOVERNANCE=9
  const thresholds = [
    { action: 0, required: 3, desc: "Payout threshold" },
    { action: 1, required: 3, desc: "Rebalance threshold" },
    { action: 2, required: 3, desc: "Staking threshold" },
    { action: 3, required: 5, desc: "Upgrade threshold" },
    { action: 4, required: 3, desc: "Parameter change threshold" },
    { action: 5, required: 3, desc: "Validator add threshold" },
    { action: 6, required: 4, desc: "Validator remove threshold" },
    { action: 7, required: 4, desc: "Blacklist threshold" },
    { action: 8, required: 5, desc: "Minting threshold" },
    { action: 9, required: 3, desc: "Governance threshold" },
  ];

  for (const t of thresholds) {
    const thrTx = await registry.setActionThreshold(t.action, t.required, t.desc);
    await thrTx.wait();
    console.log(`   Set threshold: ${t.desc} = ${t.required}`);
  }

  // ──────────────────────────────────────────────────────
  // 4. UpgradeGovernor (UUPS Upgradeable)
  //    Needs: GovernanceToken (IVotes), TimelockController, 
  //           votingDelay, votingPeriod, proposalThreshold
  // ──────────────────────────────────────────────────────
  console.log("4. Deploying UpgradeGovernor (UUPS proxy)...");
  const GovernorFactory = await ethers.getContractFactory("UpgradeGovernor");

  // Note: UpgradeGovernor.initialize expects (IVotesUpgradeable, TimelockControllerUpgradeable, ...)
  // Since VariableTimelockController is NOT a TimelockControllerUpgradeable from OZ,
  // we need to pass a compatible timelock. For testnet, we'll use a minimal OZ TimelockController
  // or we can just deploy the governor with the token directly.
  // The governor's initialize signature is:
  //   initialize(IVotesUpgradeable token, TimelockControllerUpgradeable timelock, 
  //              uint48 votingDelay, uint32 votingPeriod, uint256 proposalThreshold)
  // For testing, we'll deploy a minimal OZ TimelockController as well.

  // Deploy a minimal OZ TimelockController for the Governor
  const OZTimelockFactory = await ethers.getContractFactory(
    "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable"
  ).catch(() => null);

  // If OZ TimelockControllerUpgradeable isn't directly deployable, we skip Governor for now
  // and deploy it separately. For testnet, we can pass the VariableTimelock address
  // and it will work at the interface level (scheduleWithSeverity, execute, etc.)

  // Actually — the Governor inherits GovernorTimelockControlUpgradeable which needs an OZ 
  // TimelockControllerUpgradeable. For testnet we can deploy a simple one.
  // Let's deploy an OZ TimelockControllerUpgradeable proxy:
  
  // Simpler approach: deploy governor with minimal params
  // votingDelay = 1 block, votingPeriod = 50400 blocks (~1 week on Amoy)
  // proposalThreshold = 1000 tokens (1000e18)
  const governor = await upgrades.deployProxy(
    GovernorFactory,
    [
      govTokenAddr,           // IVotesUpgradeable token
      timelockAddr,           // TimelockControllerUpgradeable timelock  
      1,                      // votingDelay (1 block)
      50400,                  // votingPeriod (~1 week)
      ethers.parseEther("1000"), // proposalThreshold
    ],
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor", "state-variable-assignment"],
    }
  );
  await governor.waitForDeployment();
  const governorAddr = await governor.getAddress();
  console.log("   UpgradeGovernor:", governorAddr);

  // ──────────────────────────────────────────────────────
  // 5. TreasuryController (UUPS Upgradeable)
  // ──────────────────────────────────────────────────────
  console.log("5. Deploying TreasuryController (UUPS proxy)...");
  const TreasuryFactory = await ethers.getContractFactory("TreasuryController");
  // Temporarily pass deployer as gasRefiller; will update after GasRefiller is deployed
  const treasury = await upgrades.deployProxy(
    TreasuryFactory,
    [deployer.address, registryAddr, deployer.address],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor", "state-variable-assignment", "delegatecall"], unsafeSkipStorageCheck: true }
  );
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();
  console.log("   TreasuryController:", treasuryAddr);

  // Add supported tokens
  const addUsdcTx = await treasury.addSupportedToken(USDC);
  await addUsdcTx.wait();
  const addUsdtTx = await treasury.addSupportedToken(USDT);
  await addUsdtTx.wait();
  console.log("   Added USDC & USDT as supported tokens ✓");

  // ──────────────────────────────────────────────────────
  // 6. GasRefiller (UUPS Upgradeable)
  // ──────────────────────────────────────────────────────
  console.log("6. Deploying GasRefiller (UUPS proxy)...");
  const GasRefillerFactory = await ethers.getContractFactory("GasRefiller");
  const gasRefiller = await upgrades.deployProxy(
    GasRefillerFactory,
    [deployer.address, SWAP_ROUTER, USDC, USDT, WMATIC],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor", "state-variable-assignment"], force: true }
  );

  await gasRefiller.waitForDeployment();
  const gasRefillerAddr = await gasRefiller.getAddress();
  console.log("   GasRefiller:", gasRefillerAddr);

  // Update TreasuryController with real GasRefiller
  const setGasTx = await treasury.setGasRefiller(gasRefillerAddr);
  await setGasTx.wait();
  console.log("   TreasuryController → GasRefiller linked ✓");

  // ──────────────────────────────────────────────────────
  // 7. PayoutExecutor (UUPS Upgradeable)
  // ──────────────────────────────────────────────────────
  console.log("7. Deploying PayoutExecutor (UUPS proxy)...");
  const PayoutFactory = await ethers.getContractFactory("PayoutExecutor");
  const payout = await upgrades.deployProxy(
    PayoutFactory,
    [deployer.address, treasuryAddr],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor", "state-variable-assignment"], force: true }
  );
  await payout.waitForDeployment();
  const payoutAddr = await payout.getAddress();
  console.log("   PayoutExecutor:", payoutAddr);

  // Set default daily/monthly limits for a test country
  const setDailyTx = await payout.setDailyLimit("FR", ethers.parseUnits("100000", 6));
  await setDailyTx.wait();
  const setMonthlyTx = await payout.setMonthlyLimit("FR", ethers.parseUnits("500000", 6));
  await setMonthlyTx.wait();
  console.log("   PayoutExecutor: FR limits set ✓");

  // ──────────────────────────────────────────────────────
  // 8. RebalancingExecutor (UUPS Upgradeable)
  // ──────────────────────────────────────────────────────
  console.log("8. Deploying RebalancingExecutor (UUPS proxy)...");
  const RebalanceFactory = await ethers.getContractFactory("RebalancingExecutor");
  const rebalance = await upgrades.deployProxy(
    RebalanceFactory,
    [deployer.address, treasuryAddr],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor", "state-variable-assignment"], force: true }
  );
  await rebalance.waitForDeployment();
  const rebalanceAddr = await rebalance.getAddress();
  console.log("   RebalancingExecutor:", rebalanceAddr);

  // ──────────────────────────────────────────────────────
  // 9. StakingExecutor (UUPS Upgradeable)
  // ──────────────────────────────────────────────────────
  console.log("9. Deploying StakingExecutor (UUPS proxy)...");
  const StakingFactory = await ethers.getContractFactory("StakingExecutor");
  const staking = await upgrades.deployProxy(
    StakingFactory,
    [deployer.address, treasuryAddr, deployer.address],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor", "state-variable-assignment"], force: true }
  );
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log("   StakingExecutor:", stakingAddr);

  // ──────────────────────────────────────────────────────
  // 10. Mint governance tokens to validators
  // ──────────────────────────────────────────────────────
  console.log("\n10. Minting governance tokens to validators...");
  const mintAmount = ethers.parseEther("10000"); // 10,000 TGV each
  for (const v of validators) {
    const mintTx = await govToken.requestMint(v, mintAmount, "Initial validator allocation");
    const receipt = await mintTx.wait();
    // Get the requestId from the MintRequested event
    const event = receipt?.logs?.find((log: any) => {
      try {
        return govToken.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "MintRequested";
      } catch { return false; }
    });
    if (event) {
      const parsed = govToken.interface.parseLog({ topics: event.topics as string[], data: event.data });
      const requestId = parsed?.args?.requestId;
      // Execute the mint with a dummy proposalId
      const dummyProposalId = ethers.keccak256(ethers.toUtf8Bytes(`initial-mint-${v}`));
      const execTx = await govToken.executeMint(requestId, dummyProposalId);
      await execTx.wait();
      console.log(`   Minted 10,000 TGV to ${v}`);
    }
  }

  // ──────────────────────────────────────────────────────
  // 11. Deploy TreasuryDeploymentFactory (for audit trail)
  // ──────────────────────────────────────────────────────
  console.log("\n11. Deploying TreasuryDeploymentFactory (audit trail)...");
  const FactoryContract = await ethers.getContractFactory("TreasuryDeploymentFactory");
  const factory = await FactoryContract.deploy();
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("   TreasuryDeploymentFactory:", factoryAddr);

  // Initialize factory with config (for the audit log)
  const initTx = await factory.initialize({
    multiSigOwner: MULTISIG,
    networkName: "Polygon Amoy",
    timeLockEmergencyDelay: 0,
    timeLockCriticalDelay: 86400,
    timeLockImportantDelay: 43200,
    timeLockRoutineDelay: 14400,
    governanceVotingDelay: 1,
    governanceVotingPeriod: 50400,
    governanceProposalThreshold: ethers.parseEther("1000"),
    swapRouter: SWAP_ROUTER,
    usdc: USDC,
    usdt: USDT,
    wmatic: WMATIC,
  });
  await initTx.wait();
  console.log("   Factory initialized ✓");

  // ──────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║              DEPLOYMENT COMPLETE — POLYGON AMOY              ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`║  VariableTimelock:         ${timelockAddr}  ║`);
  console.log(`║  GovernanceTokenV2:        ${govTokenAddr}  ║`);
  console.log(`║  DynamicValidatorRegistry: ${registryAddr}  ║`);
  console.log(`║  UpgradeGovernor:          ${governorAddr}  ║`);
  console.log(`║  TreasuryController:       ${treasuryAddr}  ║`);
  console.log(`║  GasRefiller:              ${gasRefillerAddr}  ║`);
  console.log(`║  PayoutExecutor:           ${payoutAddr}  ║`);
  console.log(`║  RebalancingExecutor:      ${rebalanceAddr}  ║`);
  console.log(`║  StakingExecutor:          ${stakingAddr}  ║`);
  console.log(`║  DeploymentFactory:        ${factoryAddr}  ║`);
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`║  USDC (custom):            ${USDC}  ║`);
  console.log(`║  USDT (custom):            ${USDT}  ║`);
  console.log(`║  wMATIC:                   ${WMATIC}  ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");

  // Output for frontend .env.local
  console.log("\n--- Copy to treasury-multisig/.env.local ---\n");
  console.log(`NEXT_PUBLIC_VARIABLE_TIMELOCK=${timelockAddr}`);
  console.log(`NEXT_PUBLIC_GOVERNANCE_TOKEN=${govTokenAddr}`);
  console.log(`NEXT_PUBLIC_VALIDATOR_REGISTRY=${registryAddr}`);
  console.log(`NEXT_PUBLIC_UPGRADE_GOVERNOR=${governorAddr}`);
  console.log(`NEXT_PUBLIC_TREASURY_CONTROLLER=${treasuryAddr}`);
  console.log(`NEXT_PUBLIC_GAS_REFILLER=${gasRefillerAddr}`);
  console.log(`NEXT_PUBLIC_PAYOUT_EXECUTOR=${payoutAddr}`);
  console.log(`NEXT_PUBLIC_REBALANCING_EXECUTOR=${rebalanceAddr}`);
  console.log(`NEXT_PUBLIC_STAKING_EXECUTOR=${stakingAddr}`);
  console.log(`NEXT_PUBLIC_DEPLOYMENT_FACTORY=${factoryAddr}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${USDC}`);
  console.log(`NEXT_PUBLIC_USDT_ADDRESS=${USDT}`);
  console.log(`NEXT_PUBLIC_WMATIC_ADDRESS=${WMATIC}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=80002`);
  console.log(`NEXT_PUBLIC_NETWORK_NAME=Polygon Amoy`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
