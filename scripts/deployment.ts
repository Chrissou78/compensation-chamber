import { ethers, upgrades, run } from "hardhat";

// ─── Deployment State (for resume-on-failure) ───────────────────
interface DeploymentState {
  timelockAddr?: string;
  govTokenAddr?: string;
  registryAddr?: string;
  ozTimelockAddr?: string;
  governorAddr?: string;
  treasuryAddr?: string;
  gasRefillerAddr?: string;
  payoutAddr?: string;
  rebalanceAddr?: string;
  stakingAddr?: string;
  factoryAddr?: string;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║          COMPENSATION CHAMBER — DEPLOYMENT SCRIPT           ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`║  Deployer:  ${deployer.address}  ║`);
  console.log(`║  Balance:   ${ethers.formatEther(balance)} MATIC            `);
  console.log(`║  Network:   ${(await ethers.provider.getNetwork()).name} (chainId: ${(await ethers.provider.getNetwork()).chainId})`);
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ─── Pre-flight checks ────────────────────────────────────────
  if (balance < ethers.parseEther("0.5")) {
    throw new Error(`Insufficient balance: ${ethers.formatEther(balance)} MATIC. Need at least 0.5 MATIC.`);
  }

  const USDC = process.env.USDC_ADDRESS;
  const USDT = process.env.USDT_ADDRESS;
  const WMATIC = process.env.WMATIC_ADDRESS;
  const SWAP_ROUTER = process.env.SWAP_ROUTER;
  const MULTISIG = process.env.MULTISIG_OWNER || deployer.address;

  if (!USDC || !USDT || !WMATIC || !SWAP_ROUTER) {
    throw new Error("Missing required env vars: USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, SWAP_ROUTER");
  }

  const validators = [
    process.env.VALIDATOR_1,
    process.env.VALIDATOR_2,
    process.env.VALIDATOR_3,
    process.env.VALIDATOR_4,
    process.env.VALIDATOR_5,
  ].filter(Boolean) as string[];

  if (validators.length < 3) {
    throw new Error(`Need at least 3 validators, got ${validators.length}. Set VALIDATOR_1 through VALIDATOR_5 in .env`);
  }

  console.log(`Multisig:    ${MULTISIG}`);
  console.log(`Validators:  ${validators.length}`);
  console.log(`USDC:        ${USDC}`);
  console.log(`USDT:        ${USDT}`);
  console.log(`WMATIC:      ${WMATIC}`);
  console.log(`SwapRouter:  ${SWAP_ROUTER}`);
  console.log("");

  const state: DeploymentState = {};

  // ──────────────────────────────────────────────────────────────
  // 1. VariableTimelockController (Non-upgradeable, Ownable)
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Step 1/11: VariableTimelockController ━━━");
  const TimelockFactory = await ethers.getContractFactory("VariableTimelockController");
  const timelock = await TimelockFactory.deploy();
  await timelock.waitForDeployment();
  state.timelockAddr = await timelock.getAddress();
  console.log(`  Deployed: ${state.timelockAddr}`);

  const tx1 = await timelock.initialize(
    deployer.address,
    0,      // emergency: 0s
    86400,  // critical: 24h
    43200,  // important: 12h
    14400   // routine: 4h
  );
  await tx1.wait();
  console.log("  Initialized ✓\n");

  // ──────────────────────────────────────────────────────────────
  // 2. GovernanceTokenV2 (UUPS Proxy)
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Step 2/11: GovernanceTokenV2 ━━━");
  const GovTokenFactory = await ethers.getContractFactory("GovernanceTokenV2");
  const govToken = await upgrades.deployProxy(
    GovTokenFactory,
    [deployer.address],
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor", "state-variable-assignment"],
    }
  );
  await govToken.waitForDeployment();
  state.govTokenAddr = await govToken.getAddress();
  console.log(`  Deployed: ${state.govTokenAddr}\n`);

  // ──────────────────────────────────────────────────────────────
  // 3. DynamicValidatorRegistry (UUPS Proxy)
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Step 3/11: DynamicValidatorRegistry ━━━");
  const RegistryFactory = await ethers.getContractFactory("DynamicValidatorRegistry");
  const registry = await upgrades.deployProxy(
    RegistryFactory,
    [deployer.address],
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor", "state-variable-assignment"],
    }
  );
  await registry.waitForDeployment();
  state.registryAddr = await registry.getAddress();
  console.log(`  Deployed: ${state.registryAddr}`);

  // Add validators
  const validatorNames = ["CEO", "CFO", "Compliance Officer", "Technical Lead", "External Auditor"];
  const validatorRoles = ["Executive", "Finance", "Risk", "Engineering", "Audit"];

  for (let i = 0; i < validators.length; i++) {
    const addTx = await registry.addValidator(
      validators[i],
      validatorNames[i] || `Validator ${i + 1}`,
      validatorRoles[i] || `Role ${i + 1}`
    );
    await addTx.wait();
    console.log(`  Validator ${i + 1}: ${validators[i]} (${validatorNames[i]})`);
  }

  // Set action thresholds
  const thresholds = [
    { action: 0, required: 3, desc: "Payout" },
    { action: 1, required: 3, desc: "Rebalance" },
    { action: 2, required: 3, desc: "Staking" },
    { action: 3, required: 5, desc: "Upgrade" },
    { action: 4, required: 3, desc: "Parameter change" },
    { action: 5, required: 3, desc: "Validator add" },
    { action: 6, required: 4, desc: "Validator remove" },
    { action: 7, required: 4, desc: "Blacklist" },
    { action: 8, required: 5, desc: "Minting" },
    { action: 9, required: 3, desc: "Governance" },
  ];

  for (const t of thresholds) {
    // Cap required signatures to actual validator count
    const required = Math.min(t.required, validators.length);
    const thrTx = await registry.setActionThreshold(t.action, required, `${t.desc} threshold`);
    await thrTx.wait();
    console.log(`  Threshold: ${t.desc} = ${required}-of-${validators.length}`);
  }
  console.log("");

  // ──────────────────────────────────────────────────────────────
  // 4. OZ TimelockControllerUpgradeable (for UpgradeGovernor)
  //    VariableTimelockController is NOT an OZ TimelockController.
  //    UpgradeGovernor inherits GovernorTimelockControlUpgradeable,
  //    which requires an OZ TimelockControllerUpgradeable.
  //    Deploy it as a plain contract behind an ERC1967Proxy.
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Step 4/11: OZ TimelockController (for Governor) ━━━");
  const OZTimelockFactory = await ethers.getContractFactory("TimelockControllerUpgradeable");
  const ozTimelockImpl = await OZTimelockFactory.deploy();
  await ozTimelockImpl.waitForDeployment();
  console.log(`  Implementation: ${await ozTimelockImpl.getAddress()}`);

  const ERC1967ProxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const ozTimelockInitData = OZTimelockFactory.interface.encodeFunctionData("initialize", [
    0,                   // minDelay
    [deployer.address],  // proposers (deployer for now, will be governor)
    [deployer.address],  // executors
    deployer.address,    // admin
  ]);
  const ozTimelockProxy = await ERC1967ProxyFactory.deploy(
    await ozTimelockImpl.getAddress(),
    ozTimelockInitData
  );
  await ozTimelockProxy.waitForDeployment();
  state.ozTimelockAddr = await ozTimelockProxy.getAddress();
  const ozTimelock = OZTimelockFactory.attach(state.ozTimelockAddr);
  console.log(`  Proxy: ${state.ozTimelockAddr}\n`);

  // ──────────────────────────────────────────────────────────────
  // 5. UpgradeGovernor (UUPS Proxy)
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Step 5/11: UpgradeGovernor ━━━");
  const GovernorFactory = await ethers.getContractFactory("UpgradeGovernor");
  const governor = await upgrades.deployProxy(
    GovernorFactory,
    [
      state.govTokenAddr,       // IVotes token
      state.ozTimelockAddr,     // OZ TimelockControllerUpgradeable
      1,                        // votingDelay: 1 block
      50400,                    // votingPeriod: ~7 days on Polygon
      ethers.parseEther("1000"),// proposalThreshold: 1000 TGV
    ],
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor", "state-variable-assignment"],
    }
  );
  await governor.waitForDeployment();
  state.governorAddr = await governor.getAddress();
  console.log(`  Deployed: ${state.governorAddr}`);

  // Grant PROPOSER_ROLE to governor on the OZ timelock
  const PROPOSER_ROLE = await ozTimelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await ozTimelock.EXECUTOR_ROLE();
  const CANCELLER_ROLE = await ozTimelock.CANCELLER_ROLE();

  const grantProposerTx = await ozTimelock.grantRole(PROPOSER_ROLE, state.governorAddr);
  await grantProposerTx.wait();
  const grantExecutorTx = await ozTimelock.grantRole(EXECUTOR_ROLE, state.governorAddr);
  await grantExecutorTx.wait();
  const grantCancellerTx = await ozTimelock.grantRole(CANCELLER_ROLE, state.governorAddr);
  await grantCancellerTx.wait();
  console.log("  Governor granted PROPOSER + EXECUTOR + CANCELLER roles on OZ Timelock ✓\n");

  // ──────────────────────────────────────────────────────────────
  // 6. TreasuryController (UUPS Proxy)
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Step 6/11: TreasuryController ━━━");
  const TreasuryFactory = await ethers.getContractFactory("TreasuryController");
  // Deploy with deployer as temporary gasRefiller; will update after GasRefiller is deployed
  const treasury = await upgrades.deployProxy(
    TreasuryFactory,
    [deployer.address, state.registryAddr, deployer.address],
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor", "state-variable-assignment", "delegatecall"],
      unsafeSkipStorageCheck: true,
    }
  );
  await treasury.waitForDeployment();
  state.treasuryAddr = await treasury.getAddress();
  console.log(`  Deployed: ${state.treasuryAddr}`);

  // Add supported tokens
  await (await treasury.addSupportedToken(USDC)).wait();
  await (await treasury.addSupportedToken(USDT)).wait();
  console.log("  Supported tokens: USDC, USDT ✓");

  // Authorize deployer as agent (for initial testing — revoke before multisig handoff)
  await (await treasury.authorizeAgent(deployer.address)).wait();
  console.log("  Deployer authorized as agent (temporary) ✓\n");

  // ──────────────────────────────────────────────────────────────
  // 7. GasRefiller (UUPS Proxy)
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Step 7/11: GasRefiller ━━━");
  const GasRefillerFactory = await ethers.getContractFactory("GasRefiller");
  const gasRefiller = await upgrades.deployProxy(
    GasRefillerFactory,
    [deployer.address, SWAP_ROUTER, USDC, USDT, WMATIC],
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor", "state-variable-assignment"],
      force: true,
    }
  );
  await gasRefiller.waitForDeployment();
  state.gasRefillerAddr = await gasRefiller.getAddress();
  console.log(`  Deployed: ${state.gasRefillerAddr}`);

  // Link TreasuryController → GasRefiller
  await (await treasury.setGasRefiller(state.gasRefillerAddr)).wait();
  console.log("  TreasuryController → GasRefiller linked ✓\n");

  // ──────────────────────────────────────────────────────────────
  // 8. PayoutExecutor (UUPS Proxy)
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Step 8/11: PayoutExecutor ━━━");
  const PayoutFactory = await ethers.getContractFactory("PayoutExecutor");
  const payout = await upgrades.deployProxy(
    PayoutFactory,
    [deployer.address, state.treasuryAddr],
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor", "state-variable-assignment"],
      force: true,
    }
  );
  await payout.waitForDeployment();
  state.payoutAddr = await payout.getAddress();
  console.log(`  Deployed: ${state.payoutAddr}`);

  // Set initial country limits
  const countries = [
    { code: "FR", daily: "100000", monthly: "500000" },
    { code: "US", daily: "200000", monthly: "1000000" },
    { code: "UK", daily: "150000", monthly: "750000" },
  ];

  for (const c of countries) {
    await (await payout.setDailyLimit(c.code, ethers.parseUnits(c.daily, 6))).wait();
    await (await payout.setMonthlyLimit(c.code, ethers.parseUnits(c.monthly, 6))).wait();
    console.log(`  ${c.code}: daily=${c.daily} / monthly=${c.monthly} USDC`);
  }
  console.log("");

  // ──────────────────────────────────────────────────────────────
  // 9. RebalancingExecutor (UUPS Proxy)
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Step 9/11: RebalancingExecutor ━━━");
  const RebalanceFactory = await ethers.getContractFactory("RebalancingExecutor");
  const rebalance = await upgrades.deployProxy(
    RebalanceFactory,
    [deployer.address, state.treasuryAddr],
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor", "state-variable-assignment"],
      force: true,
    }
  );
  await rebalance.waitForDeployment();
  state.rebalanceAddr = await rebalance.getAddress();
  console.log(`  Deployed: ${state.rebalanceAddr}\n`);

  // ──────────────────────────────────────────────────────────────
  // 10. StakingExecutor (UUPS Proxy)
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Step 10/11: StakingExecutor ━━━");
  const StakingFactory = await ethers.getContractFactory("StakingExecutor");
  const staking = await upgrades.deployProxy(
    StakingFactory,
    [deployer.address, state.treasuryAddr, deployer.address], // stakingPool = deployer for now
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor", "state-variable-assignment"],
      force: true,
    }
  );
  await staking.waitForDeployment();
  state.stakingAddr = await staking.getAddress();
  console.log(`  Deployed: ${state.stakingAddr}\n`);

  // ──────────────────────────────────────────────────────────────
  // 11. Mint Governance Tokens to Validators
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Step 11/11: Mint Governance Tokens ━━━");
  const mintAmount = ethers.parseEther("10000"); // 10,000 TGV per validator

  for (let i = 0; i < validators.length; i++) {
    const mintTx = await govToken.requestMint(
      validators[i],
      mintAmount,
      `Initial allocation for ${validatorNames[i] || "Validator " + (i + 1)}`
    );
    const receipt = await mintTx.wait();

    const event = receipt?.logs?.find((log: any) => {
      try {
        return govToken.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "MintRequested";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = govToken.interface.parseLog({ topics: event.topics as string[], data: event.data });
      const requestId = parsed?.args?.[0];
      const proposalId = ethers.keccak256(ethers.toUtf8Bytes(`initial-mint-${validators[i]}`));
      await (await govToken.executeMint(requestId, proposalId)).wait();
      console.log(`  Minted 10,000 TGV → ${validators[i]}`);
    }
  }
  console.log("");

  // ──────────────────────────────────────────────────────────────
  // POST-DEPLOYMENT VERIFICATION
  // ──────────────────────────────────────────────────────────────
  console.log("━━━ Post-Deployment Verification ━━━");

  // Verify TreasuryController state
  const tcPaused = await treasury.paused();
  const tcGasRefiller = await treasury.gasRefiller();
  const tcUsdcSupported = await treasury.supportedTokens(USDC);
  console.log(`  TreasuryController paused: ${tcPaused} (expected: false)`);
  console.log(`  TreasuryController gasRefiller: ${tcGasRefiller}`);
  console.log(`  TreasuryController USDC supported: ${tcUsdcSupported}`);

  // Verify Registry
  const activeValidators = await registry.getActiveValidatorCount();
  console.log(`  Registry active validators: ${activeValidators} (expected: ${validators.length})`);

  // Verify GovernanceToken
  const totalSupply = await govToken.totalSupply();
  console.log(`  GovernanceToken totalSupply: ${ethers.formatEther(totalSupply)} TGV`);

  // Verify Governor
  const govName = await governor.name();
  const votingDelay = await governor.votingDelay();
  const votingPeriod = await governor.votingPeriod();
  console.log(`  UpgradeGovernor name: ${govName}`);
  console.log(`  UpgradeGovernor votingDelay: ${votingDelay} blocks`);
  console.log(`  UpgradeGovernor votingPeriod: ${votingPeriod} blocks`);
  console.log("");

  // ──────────────────────────────────────────────────────────────
  // DEPLOYMENT SUMMARY
  // ──────────────────────────────────────────────────────────────
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  const gasCost = balance - finalBalance;

  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║                    DEPLOYMENT COMPLETE                          ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log(`║  VariableTimelockController:  ${state.timelockAddr}`);
  console.log(`║  GovernanceTokenV2:           ${state.govTokenAddr}`);
  console.log(`║  DynamicValidatorRegistry:    ${state.registryAddr}`);
  console.log(`║  OZ TimelockController:       ${state.ozTimelockAddr}`);
  console.log(`║  UpgradeGovernor:             ${state.governorAddr}`);
  console.log(`║  TreasuryController:          ${state.treasuryAddr}`);
  console.log(`║  GasRefiller:                 ${state.gasRefillerAddr}`);
  console.log(`║  PayoutExecutor:              ${state.payoutAddr}`);
  console.log(`║  RebalancingExecutor:         ${state.rebalanceAddr}`);
  console.log(`║  StakingExecutor:             ${state.stakingAddr}`);
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log(`║  Total gas cost: ${ethers.formatEther(gasCost)} MATIC`);
  console.log(`║  Remaining balance: ${ethers.formatEther(finalBalance)} MATIC`);
  console.log("╚══════════════════════════════════════════════════════════════════╝");

  // ──────────────────────────────────────────────────────────────
  // FRONTEND .env.local OUTPUT
  // ──────────────────────────────────────────────────────────────
  console.log("\n─── Copy to treasury-multisig/.env.local ───\n");
  console.log(`VARIABLE_TIMELOCK=${state.timelockAddr}`);
  console.log(`GOVERNANCE_TOKEN=${state.govTokenAddr}`);
  console.log(`VALIDATOR_REGISTRY=${state.registryAddr}`);
  console.log(`OZ_TIMELOCK=${state.ozTimelockAddr}`);
  console.log(`UPGRADE_GOVERNOR=${state.governorAddr}`);
  console.log(`TREASURY_CONTROLLER=${state.treasuryAddr}`);
  console.log(`GAS_REFILLER=${state.gasRefillerAddr}`);
  console.log(`PAYOUT_EXECUTOR=${state.payoutAddr}`);
  console.log(`REBALANCING_EXECUTOR=${state.rebalanceAddr}`);
  console.log(`STAKING_EXECUTOR=${state.stakingAddr}`);
  console.log(`USDC_ADDRESS=${USDC}`);
  console.log(`USDT_ADDRESS=${USDT}`);
  console.log(`WMATIC_ADDRESS=${WMATIC}`);
  console.log(`SWAP_ROUTER=${SWAP_ROUTER}`);
  console.log(`CHAIN_ID=80002`);
  console.log(`NETWORK_NAME=Polygon Amoy`);

  // ──────────────────────────────────────────────────────────────
  // OWNERSHIP TRANSFER REMINDER
  // ──────────────────────────────────────────────────────────────
  if (MULTISIG !== deployer.address) {
    console.log("\n─── OWNERSHIP TRANSFER CHECKLIST ───");
    console.log("Before transferring ownership to the multisig, ensure:");
    console.log("  1. All contracts are verified on Polygonscan");
    console.log("  2. All validators have delegated their TGV tokens");
    console.log("  3. Multisig wallet is properly configured (3-of-5)");
    console.log("  4. Revoke deployer as TreasuryController agent");
    console.log("");
    console.log("Then run the ownership transfer script:");
    console.log("  npx hardhat run scripts/transfer-ownership.ts --network amoy");
  }
}

main().catch((error) => {
  console.error("\n❌ DEPLOYMENT FAILED");
  console.error(error);
  process.exitCode = 1;
});
