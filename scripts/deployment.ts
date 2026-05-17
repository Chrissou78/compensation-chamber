import { ethers } from "hardhat";
import { TreasuryDeploymentFactory } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // 1. Deploy factory
  const Factory = await ethers.getContractFactory("TreasuryDeploymentFactory");
  const factory = await Factory.deploy();
  await factory.deployed();
  console.log(`Factory deployed: ${factory.address}`);
  
  // 2. Initialize factory with config
  const config = {
    multiSigOwner: "0x...", // 3-of-5 multisig address
    networkName: "Polygon Amoy",
    timeLockEmergencyDelay: 0,
    timeLockCriticalDelay: 86400,
    timeLockImportantDelay: 43200,
    timeLockRoutineDelay: 14400,
    governanceVotingDelay: 1,
    governanceVotingPeriod: 50400,
    governanceProposalThreshold: ethers.parseEther("1000"),
    swapRouter: "0x68b3465833fb72B5A828f3456DF59703e4f7D1c7", // Uniswap V3 on Amoy
    usdc: "0x...", // USDC on Amoy
    usdt: "0x...", // USDT on Amoy
    wmatic: "0x...", // wMATIC on Amoy
  };
  
  await factory.initializeFactory(config);
  console.log("Factory initialized");
  
  // 3. Deploy implementations
  const impls = await factory.deployImplementations();
  console.log(`Implementations deployed:`, impls);
  
  // 4. Deploy proxies
  const validators = {
    wallets: [
      "0xceoWallet...",
      "0xcfoWallet...",
      "0xcompliance...",
      "0xtechLead...",
      "0xauditor...",
    ],
    names: ["CEO", "CFO", "Compliance Officer", "Technical Lead", "External Auditor"],
    roles: ["Executive", "Finance", "Risk", "Engineering", "Audit"],
  };
  
  const thresholds = {
    payoutThreshold: 3,
    rebalanceThreshold: 3,
    stakingThreshold: 3,
    upgradeThreshold: 5,
    mintingThreshold: 5,
  };
  
  await factory.deployAndInitializeProxies(impls, validators, thresholds);
  console.log("Proxies deployed and initialized");
  
  // 5. Finalize
  await factory.finalizeDeployment();
  console.log("Deployment finalized");
  
  // 6. Log final state
  const deployed = await factory.getDeployedContracts();
  console.log(`\nDeployed Contracts:`);
  console.log(`  VariableTimelock: ${deployed.variableTimelock}`);
  console.log(`  GovernanceToken: ${deployed.governanceToken}`);
  console.log(`  UpgradeGovernor: ${deployed.upgradeGovernor}`);
  console.log(`  DynamicValidatorRegistry: ${deployed.dynamicValidatorRegistry}`);
  console.log(`  TreasuryController: ${deployed.treasuryController}`);
  console.log(`  GasRefiller: ${deployed.gasRefiller}`);
  console.log(`  PayoutExecutor: ${deployed.payoutExecutor}`);
  console.log(`  RebalancingExecutor: ${deployed.rebalancingExecutor}`);
  console.log(`  StakingExecutor: ${deployed.stakingExecutor}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
