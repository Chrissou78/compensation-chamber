# Contract Specifications

## Executive Summary
The treasury system uses a tiered ownership model:

- Tier 1 (Master Controller): 3-of-5 Multisig Wallet (holds all contract ownership)
- Tier 2 (Governance Layer): UpgradeGovernor + VariableTimelockController (gates critical changes)
- Tier 3 (Execution Layer): AI Agents + Authorized Signers (execute orders via EIP-712)
- Tier 4 (Public): Token Holders (vote in governance)
All ownership transfers are irreversible after factory finalization. The 3-of-5 multisig is the ultimate authority; no single person or contract can override it.

Contract	                    Type	              Owner	              Upgradeable	    Purpose
VariableTimelockController	  Non-upgradeable	    3-of-5 Multisig	    No	            Gate actions with severity-based delays (0h-24h)
GovernanceTokenV2	            Upgradeable (UUPS)	3-of-5 Multisig	    Yes	            ERC20Votes with emergency minting & blacklisting (1M supply)
DynamicValidatorRegistry	    Upgradeable (UUPS)	3-of-5 Multisig	    Yes	            Manage validators (3-20) and action thresholds dynamically
TreasuryController	          Upgradeable (UUPS)	3-of-5 Multisig	    Yes	            Execute EIP-712 signed orders (payout, rebalance, staking) with 0.1% fees
GasRefiller	                  Upgradeable (UUPS)	3-of-5 Multisig	    Yes	            Multi-wallet management, fee swaps, automatic gas refills
PayoutExecutor	              Upgradeable (UUPS)	3-of-5 Multisig	    Yes	            Execute payouts with daily/monthly per-country limits
RebalancingExecutor	          Upgradeable (UUPS)	3-of-5 Multisig	    Yes	            Execute rebalance orders across country wallets
StakingExecutor	              Upgradeable (UUPS)	3-of-5 Multisig	    Yes	            Execute staking/unstaking with lock periods
UpgradeGovernor	              Upgradeable (UUPS)	3-of-5 Multisig	    Yes	            On-chain voting (7 days) + variable timelock
TreasuryDeploymentFactory	    Non-upgradeable	    Deployer (sealed)	  No	            Bootstrap factory for atomic deployment of all 9 contracts

# If Initialization Fails
Scenario: deployAndInitializeProxies() reverts mid-execution

# Recovery:
1. Identify which step failed (check auditLog)
2. Correct input data (e.g., fix validator address)
3. Deploy new factory (old one stuck in DEPLOYED phase)
4. Repeat initialization with corrected data
5. Proceed to finalization

Cost: Re-deploy factory + re-run steps (~$800-1K)

# If Finalization Fails
Scenario: finalizeDeployment() fails to transfer ownership

Recovery:
1. Multisig calls transferOwnership() directly on each contract
2. Manually update factory.finalized = false (if needed)
3. Re-run finalizeDeployment()

Cost: Minimal (direct calls only)

# If Multisig Address Wrong
Scenario: Config has wrong multisig address

Recovery (if discovered before finalization):
1. Do NOT finalize
2. Deploy new factory
3. Initialize with correct multisig
4. Proceed

Recovery (if discovered after finalization):
1. Correct multisig proposes "Transfer Ownership to New Multisig" via Governor
2. Vote + execute (31+ hour delay)
3. New multisig assumes control

Cost: Governance delay only (no redeploy)

## 0 - TreasuryDeploymentFactory (Non-Upgradeable, Ownable)

# Overview
Purpose: Single-use bootstrap contract that deploys and atomically initializes all treasury system contracts (9 proxies + 9 implementations) in deterministic sequence.
Owner: Deployer wallet (personal account) – sealed after finalizeDeployment()
Implementation: Non-upgradeable, Ownable (OpenZeppelin)
Status: Immutable after finalization (read-only thereafter)

# Owner
Property	            Value
Owner (Initial)	        Deployer wallet (personal account)
Owner (After Init)	    Deployer wallet (non-transferable; factory sealed)
Transfer	            Not allowed; contract becomes immutable after finalizeDeployment()
Finalized	            Yes (one-way, irreversible)
Can Modify	            No (read-only after finalization)
Purpose	                Single-use bootstrap; no ongoing control needed

# Access Control:
- deployImplementations() – Only deployer
- deployAndInitializeProxies() – Only deployer
- finalizeDeployment() – Only deployer (one-time, then factory sealed)

# Post-Deployment State:
- Factory contract exists for audit/verification purposes
- No functions callable after finalization
- All power transferred to 3-of-5 multisig

# State Variables
// Deployment configuration
DeploymentConfig public config;

// Deployed contract addresses
DeployedContracts public deployed;

// Deployment phase tracking
DeploymentPhase public phase;

// Finalization lock
bool public finalized;

// Audit log
DeploymentAuditLog[] public auditLog;

# Data Structures

## enum DeploymentPhase {
    PENDING,       // 0 - Initial state
    DEPLOYED,      // 1 - Implementations deployed
    INITIALIZED,   // 2 - Proxies + validators configured
    FINALIZED      // 3 - Ownership transferred, sealed
}

## struct DeploymentConfig {
    address multiSigOwner;                    // 3-of-5 multisig wallet
    string networkName;                       // e.g., "Polygon Amoy"
    uint256 timeLockEmergencyDelay;           // 0 seconds
    uint256 timeLockCriticalDelay;            // 86400 (1 day)
    uint256 timeLockImportantDelay;           // 43200 (12 hours)
    uint256 timeLockRoutineDelay;             // 14400 (4 hours)
    uint256 governanceVotingDelay;            // 1 block
    uint256 governanceVotingPeriod;           // 50400 blocks (~7 days)
    uint256 governanceProposalThreshold;      // 1000e18 TGV
    address swapRouter;                       // Uniswap V3 SwapRouter02
    address usdc;                             // USDC token
    address usdt;                             // USDT token
    address wmatic;                           // Wrapped MATIC
}

## struct DeployedContracts {
    address variableTimelock;
    address governanceToken;
    address upgradeGovernor;
    address dynamicValidatorRegistry;
    address treasuryController;
    address gasRefiller;
    address payoutExecutor;
    address rebalancingExecutor;
    address stakingExecutor;
}

## struct InitialValidatorSet {
    address[] wallets;
    string[] names;
    string[] roles;
}

## struct ActionThresholdSet {
    uint8 payoutThreshold;
    uint8 rebalanceThreshold;
    uint8 stakingThreshold;
    uint8 upgradeThreshold;
    uint8 mintingThreshold;
}

## struct DeploymentAuditLog {
    uint256 timestamp;
    string action;
    address actor;
    string notes;
}

# Core Functions

## initialize(DeploymentConfig calldata _config) external onlyOwner nonReentrant

Purpose: Set factory configuration and validate network/token addresses.

Inputs:
Parameter	Type	Description
_config	DeploymentConfig calldata	Full deployment configuration
Outputs: None

Access: Deployer only (onlyOwner)

State Changes:
config = _config
phase = DeploymentPhase.DEPLOYED
Emit FactoryInitialized
Validations:

multiSigOwner != address(0)
swapRouter != address(0)
usdc != address(0), usdt != address(0), wmatic != address(0)
!finalized
phase == DeploymentPhase.PENDING

Events:

## event FactoryInitialized(
    string indexed networkName,
    address indexed multiSigOwner,
    uint256 timestamp
);

Error Handling:

Error	                      Condition
AlreadyFinalized	          Called after finalization
InvalidMultisigOwner	      multiSigOwner is 0x0
InvalidTokenAddress	        USDC/USDT/wMATIC missing
InvalidSwapRouter	          Router address is 0x0

## deployImplementations() external onlyOwner nonReentrant returns (DeployedImplementations memory)

Purpose: Deploy 9 implementation contracts (logic-only, uninitialized).

Inputs: None

Outputs:

struct DeployedImplementations {
    address variableTimelockImpl;
    address governanceTokenImpl;
    address upgradeGovernorImpl;
    address dynamicValidatorRegistryImpl;
    address treasuryControllerImpl;
    address gasRefillerImpl;
    address payoutExecutorImpl;
    address rebalancingExecutorImpl;
    address stakingExecutorImpl;
}

Access: Deployer only (onlyOwner)

State Changes:

Deploys all 9 implementation contracts
Emits ImplementationsDeployed
Logs to auditLog

Validations:

phase == DeploymentPhase.DEPLOYED
!finalized
All 9 implementations deployed successfully (address != 0x0)

Events:

## event ImplementationsDeployed(
    address indexed deployer,
    uint256 timestamp,
    address variableTimelockImpl,
    address governanceTokenImpl,
    address upgradeGovernorImpl,
    address dynamicValidatorRegistryImpl,
    address treasuryControllerImpl,
    address gasRefillerImpl,
    address payoutExecutorImpl,
    address rebalancingExecutorImpl,
    address stakingExecutorImpl
);

Error Handling:

Error	                Condition
InvalidPhase	        phase != DEPLOYED
AlreadyFinalized	    Finalization already called
DeploymentFailed	    Any implementation is 0x0

## deployAndInitializeProxies(DeployedImplementations calldata impls, InitialValidatorSet calldata validators, ActionThresholdSet calldata thresholds) external onlyOwner nonReentrant

Purpose: Deploy 9 ERC1967 proxies and initialize all contracts atomically.

Inputs:

Parameter	Type	Description
impls	DeployedImplementations calldata	Implementation addresses
validators	InitialValidatorSet calldata	3-5 validator wallets, names, roles
thresholds	ActionThresholdSet calldata	Signature requirements per action
Outputs: None

Access: Deployer only (onlyOwner)

State Changes:

Deploys 9 ERC1967 proxies
Initializes all contracts via initialize() calldata
Configures validators in DynamicValidatorRegistry
Sets action thresholds
phase = DeploymentPhase.INITIALIZED
Emit ProxiesDeployed, ValidatorsConfigured, PhaseChanged

Validations:

phase == DeploymentPhase.DEPLOYED
!finalized
All implementation addresses non-zero
validators.wallets.length ∈ [3, 20]
validators.wallets.length == validators.names.length == validators.roles.length
No duplicate validators
All validator wallets non-zero
thresholds.payoutThreshold <= validators.length
thresholds.upgradeThreshold <= validators.length

Sequence:

- Deploy VariableTimelockController proxy with initialize(multiSigOwner, delays...)
- Deploy GovernanceTokenV2 proxy with initialize(multiSigOwner)
- Deploy UpgradeGovernor proxy with initialize(token, timelock, votingParams...)
- Deploy DynamicValidatorRegistry proxy with initialize(multiSigOwner)
- Deploy TreasuryController proxy with initialize(multiSigOwner, registry, gasRefiller)
- Deploy GasRefiller proxy with initialize(multiSigOwner, router, usdc, usdt, wmatic)
- Deploy PayoutExecutor proxy with initialize(multiSigOwner, treasuryController)
- Deploy RebalancingExecutor proxy with initialize(multiSigOwner, treasuryController)
- Deploy StakingExecutor proxy with initialize(multiSigOwner, treasuryController)
- Configure validators: addValidator() for each
- Set thresholds: setActionThreshold() for each action type

Events:

## event ProxiesDeployed(
    address indexed deployer,
    uint256 timestamp,
    address variableTimelock,
    address governanceToken,
    address upgradeGovernor,
    address dynamicValidatorRegistry,
    address treasuryController,
    address gasRefiller,
    address payoutExecutor,
    address rebalancingExecutor,
    address stakingExecutor
);

## event ValidatorsConfigured(
    uint256 indexed validatorCount,
    uint256 timestamp,
    address[] validators
);

## event PhaseChanged(
    DeploymentPhase indexed oldPhase,
    DeploymentPhase indexed newPhase
);

Error Handling:

Error	                          Condition
InvalidPhase	                  phase != DEPLOYED
MinimumValidatorsRequired	      < 3 validators
MaximumValidatorsExceeded	      > 20 validators
ValidatorArrayMismatch	        Length mismatch
DuplicateValidator	            Same wallet twice
ThresholdExceedsValidators	    Threshold > validator count
ProxyDeploymentFailed	          Any proxy is 0x0

## finalizeDeployment() external onlyOwner nonReentrant

Purpose: Transfer all contract ownership to 3-of-5 multisig and seal factory.

Inputs: None

Outputs: None

Access: Deployer only (onlyOwner)

State Changes:

transferOwnership() on all 9 contracts to config.multiSigOwner
finalized = true
phase = DeploymentPhase.FINALIZED
Emit DeploymentFinalized

Validations:

- phase == DeploymentPhase.INITIALIZED
- !finalized
- All 9 deployed contracts non-zero
- config.multiSigOwner != address(0)

# event DeploymentFinalized(
    address indexed finalizer,
    address indexed multiSigOwner,
    uint256 timestamp,
    address variableTimelock,
    address governanceToken,
    address upgradeGovernor,
    address dynamicValidatorRegistry,
    address treasuryController,
    address gasRefiller,
    address payoutExecutor,
    address rebalancingExecutor,
    address stakingExecutor
);

Error Handling:

Error	                      Condition
InvalidPhase	              phase != INITIALIZED
AlreadyFinalized	          Already finalized
MissingDeployedContracts	  Any contract is 0x0
InvalidMultisigOwner	      Multisig is 0x0

# View Functions

## getDeploymentConfig() external view returns (DeploymentConfig memory)

Purpose: Retrieve full deployment configuration.

Inputs: None

Outputs:

struct DeploymentConfig {
    address multiSigOwner;
    string networkName;
    uint256 timeLockEmergencyDelay;
    uint256 timeLockCriticalDelay;
    uint256 timeLockImportantDelay;
    uint256 timeLockRoutineDelay;
    uint256 governanceVotingDelay;
    uint256 governanceVotingPeriod;
    uint256 governanceProposalThreshold;
    address swapRouter;
    address usdc;
    address usdt;
    address wmatic;
}

Access: Public (anyone)

State Changes: None

## getDeployedContracts() external view returns (DeployedContracts memory)

Purpose: Retrieve all deployed proxy addresses.
Inputs: None
Outputs:

struct DeployedContracts {
    address variableTimelock;
    address governanceToken;
    address upgradeGovernor;
    address dynamicValidatorRegistry;
    address treasuryController;
    address gasRefiller;
    address payoutExecutor;
    address rebalancingExecutor;
    address stakingExecutor;
}

Access: Public (anyone)
State Changes: None

## getDeploymentPhase() external view returns (DeploymentPhase)

Purpose: Return current deployment phase.
Inputs: None
Outputs: DeploymentPhase (PENDING, DEPLOYED, INITIALIZED, or FINALIZED)
Access: Public (anyone)
State Changes: None

isDeploymentComplete() external view returns (bool)
Purpose: Check if deployment is finalized and sealed.

Inputs: None
Outputs: bool – True if finalized == true && phase == FINALIZED
Access: Public (anyone)
State Changes: None

## getMultisigOwner() external view returns (address)

Purpose: Return configured 3-of-5 multisig owner address.
Inputs: None
Outputs: address – Multisig wallet address
Access: Public (anyone)
State Changes: None

## getNetworkName() external view returns (string memory)

Purpose: Return network name from config (e.g., "Polygon Amoy").
Inputs: None
Outputs: string memory – Network identifier
Access: Public (anyone)
State Changes: None

## getTimelockDelays() external view returns (uint256, uint256, uint256, uint256)

Purpose: Return all 4 timelock delays (emergency, critical, important, routine).
Inputs: None
Outputs: (uint256 emergency, uint256 critical, uint256 important, uint256 routine)
Access: Public (anyone)
State Changes: None

## getGovernanceParams() external view returns (uint256, uint256, uint256)

Purpose: Return governance voting parameters.
Inputs: None
Outputs: (uint256 votingDelay, uint256 votingPeriod, uint256 proposalThreshold)
Access: Public (anyone)
State Changes: None

## getAuditLogLength() external view returns (uint256)

Purpose: Return total number of audit log entries.
Inputs: None

Outputs: uint256 – Number of entries
Access: Public (anyone)
State Changes: None

## getAuditLogEntry(uint256 index) external view returns (DeploymentAuditLog memory)

Purpose: Retrieve specific audit log entry.

Inputs:
Parameter	Type	Description
index	uint256	Audit log index

Outputs:

struct DeploymentAuditLog {
    uint256 timestamp;
    string action;
    address actor;
    string notes;
}

Access: Public (anyone)
State Changes: None

Error Handling:

Error	                Condition
IndexOutOfBounds	    index >= auditLog.length

## getAllAuditLogs()     external view returns (DeploymentAuditLog[] memory)

Purpose: Retrieve entire audit log.
Inputs: None
Outputs: DeploymentAuditLog[] – Array of all audit entries
Access: Public (anyone)
State Changes: None

## verifyDeployment() external view returns (bool allValid, uint256 missingCount, string[] memory missingNames)

Purpose: Verify all 9 contracts properly deployed and initialized.
Inputs: None

Outputs:

bool allValid;           // True if all contracts exist and finalized
uint256 missingCount;    // Number of missing/uninitialized contracts
string[] memory missingNames;  // Names of missing contracts
Access: Public (anyone)

State Changes: None

Logic:

Check all 9 proxy addresses non-zero
Check finalization status
Return list of missing contracts

## isDeployedProxy(address addr) external view returns (bool)

Purpose: Check if given address is a deployed proxy.

Inputs:

Parameter	Type	Description
addr	address	Address to check

Outputs: bool – True if address matches any deployed proxy
Access: Public (anyone)
State Changes: None

# Events

## event FactoryInitialized(
    string indexed networkName,
    address indexed multiSigOwner,
    uint256 timestamp
);

## event ImplementationsDeployed(
    address indexed deployer,
    uint256 timestamp,
    address variableTimelockImpl,
    address governanceTokenImpl,
    address upgradeGovernorImpl,
    address dynamicValidatorRegistryImpl,
    address treasuryControllerImpl,
    address gasRefillerImpl,
    address payoutExecutorImpl,
    address rebalancingExecutorImpl,
    address stakingExecutorImpl
);

## event ProxiesDeployed(
    address indexed deployer,
    uint256 timestamp,
    address variableTimelock,
    address governanceToken,
    address upgradeGovernor,
    address dynamicValidatorRegistry,
    address treasuryController,
    address gasRefiller,
    address payoutExecutor,
    address rebalancingExecutor,
    address stakingExecutor
);

## event ValidatorsConfigured(
    uint256 indexed validatorCount,
    uint256 timestamp,
    address[] validators
);

## event DeploymentFinalized(
    address indexed finalizer,
    address indexed multiSigOwner,
    uint256 timestamp,
    address variableTimelock,
    address governanceToken,
    address upgradeGovernor,
    address dynamicValidatorRegistry,
    address treasuryController,
    address gasRefiller,
    address payoutExecutor,
    address rebalancingExecutor,
    address stakingExecutor
);

## event PhaseChanged(
    DeploymentPhase indexed oldPhase,
    DeploymentPhase indexed newPhase,
    uint256 timestamp
);

## event AuditLogEntry(
    uint256 indexed timestamp,
    string indexed action,
    address indexed actor,
    string notes
);

# Error Codes
- error AlreadyFinalized();
- error InvalidPhase(DeploymentPhase current, DeploymentPhase expected);
- error InvalidMultisigOwner();
- error InvalidTokenAddress(string tokenName);
- error InvalidSwapRouter();
- error MinimumValidatorsRequired(uint256 required, uint256 provided);
- error MaximumValidatorsExceeded(uint256 max, uint256 attempted);
- error DuplicateValidator(address wallet);
- error ValidatorArrayLengthMismatch();
- error ThresholdExceedsValidatorCount(uint8 threshold, uint256 validatorCount);
- error DeploymentFailed(string contractName);
- error ProxyDeploymentFailed(string contractName);
- error MissingDeployedContract(string contractName);
- error IndexOutOfBounds(uint256 index, uint256 length);
- error NonReentrant();

# Owner Permissions
Function	                    Owner	  Others
initialize()	                ✓	      ✗
deployImplementations()	      ✓	      ✗
deployAndInitializeProxies()	✓	      ✗
finalizeDeployment()	        ✓	      ✗
All view functions	          ✓	      ✓

Owner: Deployer wallet (personal account)

Post-finalization: No functions callable except views (factory sealed)

# Access Control Matrix

Caller	          Can Initialize	Can Deploy Impls	Can Deploy Proxies	Can Finalize	Can View
Deployer	        ✓	              ✓	                ✓	                ✓	             ✓
3-of-5 Multisig	  ✗	              ✗	                ✗	                ✗	             ✓
Public	          ✗	              ✗	                ✗	                ✗	             ✓

# Deployment Workflow

Deployer executes:
  1. TreasuryDeploymentFactory factory = new TreasuryDeploymentFactory()
  
  2. factory.initialize(config)
     → phase = DEPLOYED
     
  3. impls = factory.deployImplementations()
     → 9 implementations deployed
     
  4. factory.deployAndInitializeProxies(impls, validators, thresholds)
     → 9 proxies deployed + initialized
     → Validators configured
     → phase = INITIALIZED
     
  5. factory.finalizeDeployment()
     → All ownership → multisig
     → finalized = true
     → phase = FINALIZED
     
  6. ✓ Deployment complete
     All authority now with 3-of-5 multisig
     Factory sealed (read-only)

# Initialization Sequence (Detailed)

## Step 1: VariableTimelockController Proxy

new ERC1967Proxy(
  implementation=impls.variableTimelock,
  initData=abi.encodeCall(
    IVariableTimelock.initialize,
    (config.multiSigOwner,
     config.timeLockEmergencyDelay,
     config.timeLockCriticalDelay,
     config.timeLockImportantDelay,
     config.timeLockRoutineDelay)
  )
)

## Step 2: GovernanceTokenV2 Proxy

new ERC1967Proxy(
  implementation=impls.governanceToken,
  initData=abi.encodeCall(
    IGovernanceToken.initialize,
    (config.multiSigOwner)
  )
)

## Step 3: UpgradeGovernor Proxy

new ERC1967Proxy(
  implementation=impls.upgradeGovernor,
  initData=abi.encodeCall(
    IUpgradeGovernor.initialize,
    (deployed.governanceToken,
     deployed.variableTimelock,
     config.governanceVotingDelay,
     config.governanceVotingPeriod,
     config.governanceProposalThreshold)
  )
)

## Step 4: DynamicValidatorRegistry Proxy

new ERC1967Proxy(
  implementation=impls.dynamicValidatorRegistry,
  initData=abi.encodeCall(
    IDynamicValidatorRegistry.initialize,
    (config.multiSigOwner)
  )
)

## Step 5: TreasuryController Proxy

new ERC1967Proxy(
  implementation=impls.treasuryController,
  initData=abi.encodeCall(
    ITreasuryController.initialize,
    (config.multiSigOwner,
     deployed.dynamicValidatorRegistry,
     deployed.gasRefiller)  // Updated after GasRefiller deployed
  )
)

## Step 6: GasRefiller Proxy

new ERC1967Proxy(
  implementation=impls.gasRefiller,
  initData=abi.encodeCall(
    IGasRefiller.initialize,
    (config.multiSigOwner,
     config.swapRouter,
     config.usdc,
     config.usdt,
     config.wmatic)
  )
)

## Step 7: PayoutExecutor Proxy

new ERC1967Proxy(
  implementation=impls.payoutExecutor,
  initData=abi.encodeCall(
    IPayoutExecutor.initialize,
    (config.multiSigOwner,
     deployed.treasuryController)
  )
)

## Step 8: RebalancingExecutor Proxy

new ERC1967Proxy(
  implementation=impls.rebalancingExecutor,
  initData=abi.encodeCall(
    IRebalancingExecutor.initialize,
    (config.multiSigOwner,
     deployed.treasuryController)
  )
)

## Step 9: StakingExecutor Proxy

new ERC1967Proxy(
  implementation=impls.stakingExecutor,
  initData=abi.encodeCall(
    IStakingExecutor.initialize,
    (config.multiSigOwner,
     deployed.treasuryController)
  )
)

## Step 10-12: Configure Validators & Thresholds

For each validator in validators.wallets:
  DynamicValidatorRegistry.addValidator(wallet, name, role)

For each action type:
  DynamicValidatorRegistry.setActionThreshold(actionType, threshold)

# Cost Summary

Phase	                          Gas	        Cost @ $2/gwei, 50 gwei
Initialize Factory	            80K	        $8
Deploy Implementations (9×)	    8M	        $800
Deploy Proxies (9×)	            5.4M	      $540
Initialize Proxies + Config	    2M	        $200
Finalize (9× transferOwnership)	300K	      $30
TOTAL	                          ~16M	      ~$1,578

# Summary Table

Property	                    Value
Type	                        Non-upgradeable Bootstrap
Owner	                        Deployer (sealed after finalization)
Core Functions	              4 (initialize, deployImplementations, deployAndInitializeProxies, finalizeDeployment)
View Functions	              11
Events	                      7
Phases	                      4 (PENDING → DEPLOYED → INITIALIZED → FINALIZED)
Deployed Contracts	          9 (1 timelock + 1 token + 1 governor + 1 registry + 5 executors)
Reentrant Protection	        Yes (nonReentrant modifier)
Audit Trail	                  Yes (on-chain log)
Atomicity	                    Yes (all-or-nothing per phase)
Immutable Post-Finalization	  Yes

## 1. VariableTimelockController (Non-Upgradeable, Ownable)

# Purpose: Gate contract upgrades and critical actions with severity-based delays.

# Owner

Property	Value
Owner	3-of-5 Multisig Wallet
Implementation	OpenZeppelin Ownable (non-upgradeable)
Transfer	Only 3-of-5 can transfer to new multisig (via governance proposal)
Critical Functions	updateActionDelay() – Owner only
Role Model	Single owner (multisig)
Access Control Matrix:

Function                    | Caller              | Requires
scheduleWithSeverity        | Owner (multisig)    | Multisig signature
scheduleWithCustomDelay     | Owner (multisig)    | Multisig signature
updateActionDelay           | Owner (multisig)    | Multisig signature
execute                     | Anyone              | Delay elapsed + valid operation
cancel                      | Owner (multisig)    | Multisig signature
isOperationReady            | Anyone              | None (view)
Who Can Schedule Actions:

Only the 3-of-5 multisig via UpgradeGovernor → VariableTimelockController.scheduleWithSeverity()
Severity-based delays:
EMERGENCY: 0h (immediate)
CRITICAL: 24h
IMPORTANT: 12h
ROUTINE: 4h
Emergency Pause Scenario:

Multisig detects exploit
Calls scheduleWithSeverity(..., EMERGENCY) → 0h delay
Immediately calls execute() to pause all operations
No governance vote needed for emergency; still requires multisig approval

# State Variables:

enum ActionSeverity { EMERGENCY, CRITICAL, IMPORTANT, ROUTINE }
mapping(ActionSeverity => uint256) public delaysByActionType;
mapping(bytes32 => uint256) public operationTimestamps;
mapping(bytes32 => bool) public operationExecuted;
uint256 public constant MAX_DELAY = 30 days;
Core Functions:

Function	Inputs	Outputs	Access	Behavior
initialize	owner, delays[4]	—	Constructor	Sets owner and all 4 delays (0h, 24h, 12h, 4h)
scheduleWithSeverity	target, value, data, predecessor, salt, severity	operationId	Owner	Schedules operation with severity-based delay
scheduleWithCustomDelay	target, value, data, predecessor, salt, delayInSeconds	operationId	Owner	Schedules with custom delay (≤ 30 days)
execute	target, value, data, predecessor, salt	—	Anyone	Executes after delay has passed; reverts if not ready
cancel	id	—	Owner	Cancels pending operation before execution
updateActionDelay	severity, newDelay	—	Owner	Updates delay for a severity level; emits ActionDelayUpdated
isOperationPending	id	bool	Public	Returns true if scheduled and not executed
isOperationReady	id	bool	Public	Returns true if delay has elapsed
isOperationDone	id	bool	Public	Returns true if executed
getOperationTimestamp	id	uint256	Public	Returns scheduled timestamp
getDelayForActionType	severity	uint256	Public	Returns delay in seconds for severity
timeUntilReady	id	uint256	Public	Returns seconds until ready (0 if ready)
Events:

OperationScheduled(bytes32 id, ActionSeverity severity, uint256 delay)
OperationExecuted(bytes32 id)
OperationCancelled(bytes32 id)
ActionDelayUpdated(ActionSeverity severity, uint256 newDelay)
Error Handling:

InvalidDelay: Custom delay > 30 days
OperationAlreadyExecuted: Re-execution attempt
OperationNotReady: Execution before delay elapses
OperationNotFound: Invalid operation ID

## 2. GovernanceTokenV2 (UUPS Upgradeable, Ownable2Step, ERC20Votes)
Purpose: Voting token for DAO; supports emergency minting and blacklisting.

# Owner

Property	Value
Owner	3-of-5 Multisig Wallet
Implementation	OpenZeppelin UUPSUpgradeable + Ownable2Step
Transfer	Only 3-of-5 can propose ownership transfer via governance
Total Supply	1,000,000 TGV (18 decimals)
Initial Distribution	200,000 TGV × 5 validators = 1,000,000 TGV
Access Control Matrix:

Function                      | Caller              | Requires
initialize                    | Constructor         | Called once
requestMint                   | Owner (multisig)    | Multisig signature
executeMint                   | Owner (multisig)    | Governance proposal approval
requestBlacklist              | Owner (multisig)    | Multisig signature
executeBlacklist              | Owner (multisig)    | Governance proposal approval
removeFromBlacklist           | Owner (multisig)    | Governance proposal approval
transfer/transferFrom         | Token holder        | Not blacklisted
delegate                      | Token holder        | Not blacklisted
_authorizeUpgrade             | Owner (multisig)    | Multisig signature (via governance)
Minting Process (Emergency Recovery):

Multisig calls requestMint(newValidatorWallet, 100_000e18, "New validator onboarded")
Governor proposes executeMint(requestId, proposalId)
Token holders vote (7 days)
Queue in timelock (CRITICAL = 24h delay)
After 24h, multisig calls executeMint()
100K new tokens minted to new validator
Who Can Vote:

Any address with delegated TGV balance
Initial 5 validators must delegate() to self
Blacklisted addresses cannot vote (ECDSA revert in voting hook)
Upgrade Path:

Governance proposal: proposeWithSeverity(..., severity=CRITICAL)
7-day voting period
24-hour timelock delay
Multisig executes upgrade via upgradeToAndCall()

# State Variables:

enum ValidatorStatus { ACTIVE, BLACKLISTED }
uint256 public constant MAX_SUPPLY = 1_000_000e18; // 1M tokens
mapping(address => bool) public blacklist;
mapping(bytes32 => MintRequest) public mintRequests;
mapping(bytes32 => BlacklistRequest) public blacklistRequests;
bytes32[] public mintRequestIds;
bytes32[] public blacklistRequestIds;
Structs:

struct MintRequest {
    address recipient;
    uint256 amount;
    string reason;
    uint256 requestedAt;
    bool executed;
    bytes32 governanceProposalId;
}

struct BlacklistRequest {
    address account;
    string reason;
    uint256 requestedAt;
    bool executed;
    bytes32 governanceProposalId;
}
Core Functions:

Function	Inputs	Outputs	Access	Behavior
initialize	owner	—	Constructor	Sets name "Treasury Governance Token", symbol "TGV", owner
requestMint	recipient, amount, reason	requestId	Owner	Creates pending mint request; reverts if recipient blacklisted or amount + supply > MAX_SUPPLY
executeMint	requestId, proposalId	—	Owner	Mints tokens; clears blacklist on recipient if set; marks request executed
cancelMintRequest	requestId, reason	—	Owner	Cancels pending request
requestBlacklist	account, reason	requestId	Owner	Creates pending blacklist request
executeBlacklist	requestId, proposalId	—	Owner	Blacklists account, burns balance, clears delegation
removeFromBlacklist	account, reason	—	Owner	Removes account from blacklist; requires governance proposal
transfer	to, amount	bool	Anyone	Blocked if to or from blacklisted; reverts with TransferBlacklisted
delegate	delegatee	—	Token Holder	Rejected if delegatee blacklisted
isBlacklisted	account	bool	Public	Returns blacklist status
getPendingMintRequests	—	MintRequest[]	Public	Returns all non-executed mint requests
getPendingBlacklistRequests	—	BlacklistRequest[]	Public	Returns all non-executed blacklist requests
getBlacklistedAddresses	—	address[]	Public	Returns all blacklisted addresses
_authorizeUpgrade	newImplementation	—	Owner	Guards upgrade permission
Events:

MintRequested(bytes32 indexed requestId, address indexed recipient, uint256 amount, string reason)
MintExecuted(bytes32 indexed requestId, address indexed recipient, uint256 amount)
MintCancelled(bytes32 indexed requestId)
BlacklistRequested(bytes32 indexed requestId, address indexed account, string reason)
BlacklistExecuted(bytes32 indexed requestId, address indexed account)
AddressBlacklisted(address indexed account, string reason)
AddressUnblacklisted(address indexed account)
Error Handling:

MintExceedsMaxSupply: Total supply would exceed 1M
RecipientBlacklisted: Cannot mint to blacklisted address
TransferBlacklisted: Sender or recipient is blacklisted
DelegateeBlacklisted: Cannot delegate to blacklisted address
RequestNotFound: Invalid request ID
RequestAlreadyExecuted: Request already processed
InsufficientBalance: Account has no tokens to revoke
Initial Distribution (Off-Chain):

CEO:                200,000 TGV (20%)
CFO:                200,000 TGV (20%)
Compliance Officer: 200,000 TGV (20%)
Technical Lead:     200,000 TGV (20%)
External Auditor:   200,000 TGV (20%)
Reserve:            0 TGV (expansion room for up to 5 new validators)
Total:              1,000,000 TGV
Each validator must delegate() to self to participate in voting.

## 3. UpgradeGovernor (UUPS Upgradeable, Governor)
Purpose: On-chain voting with 7-day deliberation and variable timelock integration.

Inheritance: Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl

# Owner 

Property	Value
Owner	3-of-5 Multisig Wallet
Implementation	OpenZeppelin Governor + GovernorTimelockControl (UUPS upgradeable)
Voting Token	GovernanceTokenV2
Timelock	VariableTimelockController
Voting Delay	1 block (~13 seconds on Polygon)
Voting Period	50,400 blocks (~7 days)
Quorum	4% of circulating TGV (40,000 TGV)
Proposal Threshold	1,000 TGV
Access Control Matrix:

Function                      | Caller              | Requires
initialize                    | Constructor         | Called once
propose                       | ≥1,000 TGV holder   | Minimum token balance
proposeWithSeverity           | ≥1,000 TGV holder   | Minimum token balance + severity
castVote                      | TGV holder          | Voting period active
castVoteWithReason            | TGV holder          | Voting period active
queue                         | Anyone              | Proposal succeeded
execute                       | Anyone              | Timelock delay elapsed
_authorizeUpgrade             | Owner (multisig)    | Multisig signature
Who Can Create Proposals:

Any address holding ≥ 1,000 TGV (delegated to self)
Initial 5 validators each hold 200,000 TGV
Can propose without multisig approval, but multisig must vote FOR
Vote Requirements (5 validators):

Quorum: 4% = 40,000 TGV (easily met with any 1 validator voting)
Majority: 50% of votes cast
Typical outcome: 3 FOR (600K), 1 ABSTAIN (200K), 1 AGAINST (200K) → Passes
Unanimous for CRITICAL: 5 FOR (1M) → Upgrade approved

# Proposal Lifecycle (Example: Add Validator)

Day 0, 14:00 UTC: Proposer creates proposal
  - targets = [DynamicValidatorRegistry]
  - calldatas = [addValidator(...)]
  - description = "Onboard new CEO"
  - severity = ROUTINE

Day 0, 14:00:13: Voting delay elapsed (1 block)
  - Voting power snapshot taken at this block

Day 0, 14:00:13 to Day 7, 14:00:13: Voting period (50,400 blocks)
  - 5 validators vote:
    - CEO: FOR
    - CFO: FOR
    - Compliance: FOR
    - Tech Lead: ABSTAIN
    - Auditor: FOR
  - Result: 4 FOR, 0 AGAINST, 1 ABSTAIN → Succeeded

Day 7, 14:00:13: Voting ends
  - Proposal state: SUCCEEDED

Day 7, 14:00:14: Queue in timelock
  - VariableTimelockController.scheduleWithSeverity(..., ROUTINE)
  - Delay: 4 hours

Day 7, 18:00:14: Delay elapsed
  - Proposal state: READY

Day 7, 18:00:15: Execute
  - DynamicValidatorRegistry.addValidator() called
  - New validator registered
  - Snapshot created: version 2

# Configuration:

uint48 public constant VOTING_DELAY = 1; // 1 block (~13 sec on Polygon)
uint32 public constant VOTING_PERIOD = 50_400; // ~7 days on Polygon
uint256 public constant PROPOSAL_THRESHOLD = 1_000e18; // 1K TGV
uint256 public constant QUORUM_NUMERATOR = 4; // 4% of circulating
Core Functions:

Function	Inputs	Outputs	Access	Behavior
initialize	token, timelock, votingDelay, votingPeriod, proposalThreshold	—	Constructor	Sets up Governor with token and timelock
propose	targets[], values[], calldatas[], description	proposalId	Anyone (≥1K TGV)	Creates proposal; emits ProposalCreated; stores severity metadata
proposeWithSeverity	targets[], values[], calldatas[], description, severity	proposalId	Anyone (≥1K TGV)	Proposes with explicit severity for timelock delay
castVote	proposalId, support	weight	Token Holder	Vote: 0=Against, 1=For, 2=Abstain; returns voting power
castVoteWithReason	proposalId, support, reason	weight	Token Holder	Vote with reason text
queue	targets[], values[], calldatas[], descriptionHash	—	Anyone	Queues in timelock with severity-based delay
execute	targets[], values[], calldatas[], descriptionHash	—	Anyone	Executes after timelock delay; reverts if not ready
cancel	targets[], values[], calldatas[], descriptionHash	—	Proposer or Majority	Cancels proposal
getVotes	account, blockNumber	uint256	Public	Returns voting power at block
getProposalState	proposalId	ProposalState	Public	Returns: Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed
proposalDeadline	proposalId	uint256	Public	Returns block number when voting ends
proposalSnapshot	proposalId	uint256	Public	Returns block number for voting power snapshot
_authorizeUpgrade	newImplementation	—	Owner	Guards upgrade permission
Events:

ProposalCreated(uint256 indexed proposalId, address indexed proposer, ...)
ProposalQueued(uint256 indexed proposalId, uint256 eta)
ProposalExecuted(uint256 indexed proposalId)
VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)
Proposal Lifecycle:

Propose (block N): Creator submits targets/calldata, must hold ≥1K TGV
Voting Delay (1 block): Voting power snapshot taken
Voting Period (50,400 blocks ≈ 7 days): Token holders vote
Queue (if Succeeded): Severity-based timelock delay starts (0h–24h)
Execute (after delay): Anyone can call execute
Example Thresholds:

ROUTINE (Add Validator): 3-of-5 FOR votes → 4h timelock
CRITICAL (Upgrade): 5-of-5 FOR votes → 24h timelock
EMERGENCY (Pause): 5-of-5 FOR votes → 0h timelock (immediate)

## 4. DynamicValidatorRegistry (UUPS Upgradeable, Ownable2Step)
Purpose: Manage validator set and action thresholds dynamically; tracks history.

# Owner
Property	Value
Owner	3-of-5 Multisig Wallet
Implementation	OpenZeppelin UUPSUpgradeable + Ownable2Step
Transfer	Only 3-of-5 can transfer via governance proposal
Direct Control	Multisig can call functions directly (no governance needed)
Validators Count	3 (minimum) to 20 (maximum)
Access Control Matrix:

Function                      | Caller              | Requires
initialize                    | Constructor         | Called once
addValidator                  | Owner (multisig)    | ≤ maxValidators constraint
removeValidator               | Owner (multisig)    | > minValidators constraint
updateValidatorStatus         | Owner (multisig)    | No constraints
setActionThreshold            | Owner (multisig)    | ≤ active validator count
setMinValidators              | Owner (multisig)    | 2 ≤ newMin ≤ currentActive
setMaxValidators              | Owner (multisig)    | currentActive ≤ newMax ≤ 50
All getters                   | Anyone              | None (view)
_authorizeUpgrade             | Owner (multisig)    | Multisig signature (via governance)
Direct Admin Actions (Multisig Only, No Governance Required):

Add Validator – addValidator(wallet, name, role)

Can be governance proposal OR direct multisig call
Best Practice: Use governance for transparency; direct for true emergencies
Remove Validator – removeValidator(validatorId)

Can be governance proposal OR direct multisig call
Enforces min constraint (≥ 3 validators always)
Blacklist Validator – updateValidatorStatus(id, BLACKLISTED)

For emergencies: Direct multisig call (immediate)
For deliberate removal: Governance proposal (7-day vote + 24h delay)
Adjust Threshold – setActionThreshold(actionType, newRequired)

For optimization: Direct multisig call (immediate)
For auditable record: Governance proposal (7-day vote + 4h delay)
Auto-Adjustment Logic:

When validator count changes, thresholds automatically recalculated
Example: 3-of-5 → 4-of-6 (maintains ~60% requirement)
Formula: newRequired = ceil(oldRequired × newCount / oldCount)
Access Pattern Flow:

                     ┌─────────────────────┐
                     │  Multisig Wallet    │
                     │  (3-of-5 signers)   │
                     └──────────┬──────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
         ┌──────▼────┐   ┌──────▼────┐   ┌────▼───────┐
         │  DIRECT   │   │GOVERNANCE │   │  TIMELOCK  │
         │   CALL    │   │  PROPOSAL │   │ SCHEDULER  │
         └──────┬────┘   └──────┬────┘   └────┬───────┘
                │               │               │
                │        7 days │ voting        │
                │               │               │
                │        Queue  │               │
                │        4h/12h/│24h delay      │
                │               │               │
         ┌──────▼───────────────▼───────────────▼──────┐
         │  DynamicValidatorRegistry.addValidator()    │
         │  (Direct) OR (Governance-approved)          │
         └─────────────────────────────────────────────┘
                                │
                         New snapshot
                         Config versioned
Validator Lifecycle:

INACTIVE (removed at T)
   ↓
ACTIVE (added at T)
   ↓
BLACKLISTED (compromised key, immediate)
   ↓
(No removal back to ACTIVE; must create new validator)

# State Variables:

enum ValidatorStatus { ACTIVE, BLACKLISTED }
enum ActionType { PAYOUT, REBALANCE, STAKING, UPGRADE, PARAMETER_CHANGE, 
                  VALIDATOR_ADD, VALIDATOR_REMOVE, BLACKLIST, MINTING, GOVERNANCE }

struct Validator {
    bytes32 id;
    address wallet;
    string name;
    string role;
    ValidatorStatus status;
    uint256 addedAt;
    uint256 removedAt;
}

struct ActionThreshold {
    bytes32 id;
    ActionType actionType;
    uint8 requiredSignatures;
    uint256 setAt;
    string description;
    bool active;
}

struct ConfigurationSnapshot {
    uint256 timestamp;
    uint256 validatorCount;
    uint8 activeCount;
    bytes32 snapshotHash;
    uint256 version;
}

mapping(bytes32 => Validator) public validators;
bytes32[] public validatorIds;
mapping(address => bytes32) public walletToValidatorId;
mapping(address => bool) public isActiveValidator;
address[] public activeValidators;

mapping(ActionType => ActionThreshold) public actionThresholds;
ConfigurationSnapshot[] public configurationHistory;

uint256 public minValidators = 3;
uint256 public maxValidators = 20;
uint256 public configurationVersion = 0;
Core Functions:

Function	                    Inputs	                                      Outputs	                  Access	        Behavior
initialize	                  owner	                                        —	                        Constructor	    Sets owner and min/max validators
addValidator	                wallet, name, role	                          validatorId	              Owner	          Adds validator if ≤ maxValidators; updates active list; snapshots config
removeValidator	              validatorId	                                  —	                        Owner	          Removes validator if > minValidators remain; marks INACTIVE; snapshots
updateValidatorStatus	        validatorId, newStatus  	                    —	                        Owner	          Changes status (ACTIVE ↔ BLACKLISTED); enforces min constraint
suspendValidator	            validatorId	                                  —	                        Deprecated	    Use updateValidatorStatus instead
setActionThreshold	          actionType, requiredSignatures, description	  —	                        Owner	          Sets threshold ≤ active count; auto-adjusts if needed; snapshots
getActiveValidators	          —	                                            address[]	                Public	        Returns current active validator addresses
getAllValidators	            —	                                            Validator[]	              Public	        Returns all validators (active + removed)
getValidator	                validatorId	                                  Validator	                Public	        Returns validator details
getValidatorByWallet	        wallet	                                      Validator	                Public	        Returns validator by address
getRequiredSignatures	        actionType	                                  uint8	                    Public	        Returns signature threshold for action
getActionThreshold	          actionType	                                  ActionThreshold	          Public	        Returns full threshold struct
getAllThresholds	            —	                                            ActionThreshold[]	        Public	        Returns all action thresholds
getThresholdHistory	          actionType	                                  ActionThreshold[]	        Public	        Returns historical thresholds for action type
getValidatorCount	            —	                                            uint256	                  Public	        Returns total validators
getActiveValidatorCount	      —	                                            uint256	                  Public	        Returns count of ACTIVE validators
getConfigurationSnapshot	    version	                                      ConfigurationSnapshot	    Public	        Returns snapshot at version
getConfigurationHistory	      —	                                            ConfigurationSnapshot[]	  Public	        Returns all snapshots
getCurrentConfigurationHash	  —	                                            bytes32	                  Public	        Returns hash of current config
setMinValidators	            newMin	                                      —	                        Owner	          Updates minimum (≥ 2, ≤ current active)
setMaxValidators	            newMax	                                      —	                        Owner	          Updates maximum (current active ≤ newMax ≤ 50)
isValidatorActive	            wallet	                                      bool	                    Public	        Returns true if active
_authorizeUpgrade	            newImplementation	                            —	                        Owner	          Guards upgrade permission

Events:

ValidatorAdded(bytes32 indexed validatorId, address indexed wallet, string name)
ValidatorRemoved(bytes32 indexed validatorId, address indexed wallet)
ValidatorStatusChanged(bytes32 indexed validatorId, ValidatorStatus oldStatus, ValidatorStatus newStatus)
ValidatorBlacklisted(bytes32 indexed validatorId, address indexed wallet)
ThresholdUpdated(ActionType indexed actionType, uint8 oldRequired, uint8 newRequired)
ValidatorCountChanged(uint256 newCount, uint256 maxValidators)
ValidatorSetVersioned(uint256 indexed version, uint256 timestamp, bytes32 snapshotHash)
ChangeLogEntry(uint256 timestamp, string action, address indexed actor)
Error Handling:

MinimumValidatorsRequired: Cannot remove validator (would violate min)
MaximumValidatorsExceeded: Cannot add validator (exceeds max)
InvalidValidatorStatus: Unknown status value
ThresholdExceedsActiveCount: Required signatures > active validators
DuplicateValidator: Wallet already registered
ValidatorNotFound: Invalid validator ID
Scenario: Expand from 5 to 7 validators

Governor proposes: addValidator(newCEOWallet, "CEO Alt", "Executive")
Vote for 7 days
Queue with ROUTINE (4h) delay
Execute after 4h
Registry auto-adjusts payout threshold: 3-of-5 → 4-of-7 (maintains ~60%)
New snapshot created: version 2

## 5. TreasuryController (UUPS Upgradeable, Ownable2Step, ReentrancyGuard)

# Purpose: Atomic order execution with multisig validation and fee collection.

# Owner

Property	          Value
Owner	              3-of-5 Multisig Wallet
Implementation	    OpenZeppelin UUPSUpgradeable + Ownable2Step + ReentrancyGuard
Transfer            Only 3-of-5 can transfer via governance proposal
Authorized Agents	  AI settlement agents (separate from owners)
Validator Registry	DynamicValidatorRegistry (set at init)
Gas Refiller	      GasRefiller contract (set at init)

Access Control Matrix:

Function                      | Caller                    | Requires
initialize                    | Constructor               | Called once
executeOrder                  | Authorized AI agent       | Valid EIP-712 + 3-of-5 signatures
authorizeAgent                | Owner (multisig)          | Multisig signature
revokeAgent                   | Owner (multisig)          | Multisig signature
setGasRefiller                | Owner (multisig)          | Multisig signature
addSupportedToken             | Owner (multisig)          | Multisig signature
pause                         | Owner (multisig)          | Multisig signature
unpause                       | Owner (multisig)          | Multisig signature
All getters                   | Anyone                    | None (view)
_authorizeUpgrade             | Owner (multisig)          | Multisig signature (via governance)
Authorized Agents:

Who: Off-chain AI settlement agents (not user wallets)
How Authorized: Multisig calls authorizeAgent(0xAIAgentAddress)
What They Can Do: Call executeOrder() with valid multisig signatures
What They Cannot Do: Authorize themselves, upgrade contract, or claim fees
Example Agent Authorization:

// Multisig-approved call (off-chain multisig signature)
TreasuryController.authorizeAgent(0x0123456789...); // AI Agent address

// Now AI Agent can execute orders:
TreasuryController.executeOrder(order, [sig1, sig2, sig3], fromWallet);
Order Execution Signature Requirements:

EIP-712 typed message signed by validators
3-of-5 signatures required (from active validators only)
Multisig wallet does NOT sign; instead, individual validator wallets sign
Replay protection: Order nonce + agent nonce + deadline
Multisig vs. Agent Roles:

3-of-5 Multisig Wallet:
  ✓ Authorize/revoke AI agents
  ✓ Pause/unpause orders
  ✓ Set gas refiller address
  ✓ Propose upgrades

AI Settlement Agent:
  ✓ Execute payout/rebalance/staking orders
  ✓ Collect signatures from validators
  ✗ Cannot modify contract state directly
  ✗ Cannot claim fees or upgrade
# State Variables:

enum OrderType { PAYOUT, REBALANCE, STAKING }

struct Order {
    OrderType orderType;
    address token;
    uint256 amount;
    address recipient;
    uint256 nonce;
    uint256 deadline;
}

bytes32 public DOMAIN_SEPARATOR;
bytes32 public constant ORDER_TYPEHASH = 
    keccak256("Order(uint8 orderType,address token,uint256 amount,address recipient,uint256 nonce,uint256 deadline)");

mapping(address => bool) public authorizedAgents;
mapping(bytes32 => bool) public executedOrders;
mapping(address => uint256) public agentNonce;

address public gasRefiller;
IDynamicValidatorRegistry public validatorRegistry;

mapping(address => bool) public supportedTokens; // USDC, USDT
mapping(string => mapping(address => uint256)) public countryTokenBalance; // country → token → balance
Core Functions:

Function	Inputs	Outputs	Access	Behavior
initialize	owner, registry, gasRefiller	—	Constructor	Sets up domain separator, registry, gas refiller
executeOrder	order, signatures[], fromWallet	orderId	Agent	Verifies 3-of-5 EIP-712 signatures, applies 0.1% fee, executes atomically; reverts on replay
authorizeAgent	agent	—	Owner	Adds AI agent to authorized list
revokeAgent	agent	—	Owner	Removes AI agent from authorized list
setGasRefiller	newGasRefiller	—	Owner	Updates gas refiller address
addSupportedToken	token	—	Owner	Adds USDC/USDT to supported list
pause	—	—	Owner	Pauses order execution
unpause	—	—	Owner	Resumes order execution
getOrderHash	order	bytes32	Public	Returns EIP-712 hash for signing
isOrderExecuted	orderId	bool	Public	Returns true if order already executed
getAgentNonce	agent	uint256	Public	Returns current nonce for agent
DOMAIN_SEPARATOR	—	bytes32	Public	Returns EIP-712 domain separator
_authorizeUpgrade	newImplementation	—	Owner	Guards upgrade permission
Internal Execution Helpers:

_verifyMultisigSignatures(orderHash, signatures) – Validates ≥3-of-5 signatures, checks signer is active, prevents duplicates
_recoverSigner(hash, signature) – Uses ECDSA recovery
_executePayout(order, fromWallet) – Transfers to recipient, 0.1% fee → GasRefiller
_executeRebalance(order, fromWallet) – Moves funds between country wallets
_executeStaking(order, fromWallet) – Sends to staking contract
Events:

OrderExecuted(bytes32 indexed orderId, OrderType indexed orderType, address indexed recipient, uint256 amount, uint256 fee)
AgentAuthorized(address indexed agent)
AgentRevoked(address indexed agent)
FeeCollected(address indexed token, uint256 amount, address gasRefiller)
Error Handling:

UnauthorizedAgent: Caller not in authorized list
InsufficientSignatures: < 3 signatures provided
InvalidSignature: Signature verification failed
OrderAlreadyExecuted: Replay attack attempt
DeadlineExpired: Order past deadline
PausedContract: Operations paused
UnsupportedToken: Token not in supported list
InsufficientBalance: Country wallet has insufficient funds
Fee Calculation:

Fee=Amount×0.001=Amount×0.1%
Net Transfer=Amount−Fee

## 6. GasRefiller (UUPS Upgradeable, Ownable2Step)

# Purpose: Multi-wallet management, fee accumulation, fee-to-MATIC swaps, gas reserve refilling.

# Owner

Property	                  Value
Owner	                      3-of-5 Multisig Wallet
Implementation	            OpenZeppelin UUPSUpgradeable + Ownable2Step
Transfer	                  Only 3-of-5 can transfer via governance proposal
Caller (receiveFees)	      TreasuryController only (internal call)
Caller (refillContractGas)	Multisig OR Authorized Keeper Bot

Access Control Matrix:

Function                      | Caller                    | Requires
initialize                    | Constructor               | Called once
addManagedWallet              | Owner (multisig)          | Multisig signature
removeManagedWallet           | Owner (multisig)          | Multisig signature
rebalanceWallets              | Owner (multisig)          | Multisig signature
registerContractGasReserve    | Owner (multisig)          | Multisig signature
refillContractGas             | Owner (multisig) OR Bot   | Multisig signature OR keeper auth
swapFeesToMatic               | Owner (multisig) OR Bot   | Multisig signature OR keeper auth
setSlippageTolerance          | Owner (multisig)          | Multisig signature
withdrawMatic                 | Owner (multisig)          | Multisig signature
receiveFees                   | TreasuryController only   | Called atomically in executeOrder
All getters                   | Anyone                    | None (view)
_authorizeUpgrade             | Owner (multisig)          | Multisig signature (via governance)
Fee Flow:

User pays 50,000 USDC for payout order
         │
         ├─► Fee calculated: 50,000 × 0.1% = 50 USDC
         │
         ├─► Net transfer: 49,950 USDC to recipient
         │
         └─► TreasuryController.receiveFees(USDC, 50)
                   │
                   └─► GasRefiller.receiveFees(USDC, 50)
                           │
                           └─► usdcAccumulated += 50
                               Emit: FeeCollected(USDC, 50)
Keeper Bot Authorization (Optional, for Gas Refills):

Alternative 1 (Full Multisig Control): Only multisig can call refillContractGas()

Safer but requires manual multisig approval
Example: Multisig UI button "Refill Gas Now"
Alternative 2 (Authorized Keeper Bot): Separate keeper contract authorized

Keeper can call refillContractGas() when needsRefill() returns true
Keeper address managed via authorizeKeeper() (multisig-only)
Removed via revokeKeeper() (multisig-only)
Benefit: Fully automated gas refills every 10 minutes
Risk: Keeper contract compromised → unauthorized refills
Mitigation: Keeper calls only if balance < threshold (validated on-chain)
Recommended: Hybrid Approach

// Phase 1 (Launch): No keeper, multisig manually calls refillContractGas()
// Phase 2 (Maturity): Enable keeper bot for automation
// Phase 3 (Optimization): Remove keeper if fully automated

// In GasRefiller:
mapping(address => bool) public authorizedKeepers;

function authorizeKeeper(address keeper) external onlyOwner {
  authorizedKeepers[keeper] = true;
}

function refillContractGas(address contract) external {
  require(msg.sender == owner() || authorizedKeepers[msg.sender], "Unauthorized");
  // ... refill logic
}
# State Variables:

struct ManagedWallet {
    address wallet;
    string country;
    uint256 maxBalance; // USDC equivalent
    bool active;
}

struct ContractGasReserve {
    address contractAddress;
    uint256 targetMatic; // e.g., 10 MATIC
    uint256 thresholdMatic; // e.g., 3 MATIC
    bool active;
}

address public swapRouter; // Uniswap V3 Router
address public usdc;
address public usdt;
address public wmatic;

ManagedWallet[] public managedWallets;
mapping(address => uint256) public walletIndex;
mapping(address => bool) public isWalletManaged;

mapping(address => ContractGasReserve) public contractGasReserves;
address[] public registeredContracts;

uint256 public usdcAccumulated;
uint256 public usdtAccumulated;
uint256 public slippageTolerance = 100; // 1% (100 bps)
Core Functions:

Function	Inputs	Outputs	Access	Behavior
initialize	owner, router, usdc, usdt, wmatic	—	Constructor	Sets DEX and token addresses
addManagedWallet	wallet, country, maxBalance	—	Owner	Adds wallet to multi-wallet portfolio; emits WalletAdded
removeManagedWallet	wallet	—	Owner	Deactivates wallet; emits WalletRemoved
getActiveManagedWallets	—	ManagedWallet[]	Public	Returns all active wallets
getManagedWalletCount	—	uint256	Public	Returns total managed wallets
rebalanceWallets	walletBalances[]	—	Owner	Validates balances ≤ maxBalance; emits BalanceRebalanced (off-chain execution)
registerContractGasReserve	contract, targetMatic, thresholdMatic	—	Owner	Registers contract for auto-refill; emits ContractRegistered
needsRefill	contract	bool	Public	Returns true if balance < threshold
refillContractGas	contract, amountMatic	—	Owner	Transfers MATIC to contract; updates reserve; emits ContractRefilled
getContractGasStatus	contract	(current, target, threshold)	Public	Returns current MATIC balance and reserve config
receiveFees	token, amount	—	TreasuryController	Accumulates fees from order execution
swapFeesToMatic	token, amount, minMaticOut	maticsReceived	Owner	Swaps USDC/USDT → MATIC via Uniswap V3; reverts if < minMatic; emits FeesSwapped
setSlippageTolerance	newTolerance	—	Owner	Updates max slippage (≤ 500 = 5%)
withdrawMatic	amount	—	Owner	Withdraws excess MATIC to owner
aggregateTokenBalances	—	(usdcTotal, usdtTotal)	Public	Sums balances across all managed wallets
_authorizeUpgrade	newImplementation	—	Owner	Guards upgrade permission
Events:

WalletAdded(address indexed wallet, string country, uint256 maxBalance)
WalletRemoved(address indexed wallet)
BalanceRebalanced(address[] wallets, uint256[] newBalances)
ContractRegistered(address indexed contract, uint256 targetMatic, uint256 thresholdMatic)
ContractRefilled(address indexed contract, uint256 maticsReceived, uint256 newBalance)
FeesSwapped(address indexed token, uint256 amountIn, uint256 maticsOut) | FeeCollected(address indexed token, uint256 amount)
Gas Refill Logic (Cron Job)

Every 10 minutes:
  FOR each registeredContract:
    IF currentBalance < thresholdMatic:
      refillContractGas(contract, targetMatic)
    
IF accumulatedFees > 500 USDC:
  swapFeesToMatic(token, accumulatedFees, minMatic)
Error Handling:

InvalidMaxBalance: maxBalance = 0
WalletNotManaged: Wallet not in portfolio
InsufficientMaticForRefill: Not enough in contract
SwapFailed: Uniswap swap returned < minMaticOut
InvalidSlippage: tolerance > 500 bps
Example Configuration:

Managed Wallets:
- US Payments: maxBalance = 1,000,000 USDC
- MX Payments: maxBalance = 500,000 USDC
- BR Payments: maxBalance = 300,000 USDC

Registered Contracts:
- TreasuryController: target=10 MATIC, threshold=3 MATIC
- PayoutExecutor: target=5 MATIC, threshold=1.5 MATIC

## 7. PayoutExecutor (UUPS Upgradeable, Ownable2Step)

# Purpose: Execute payout orders with daily/monthly limits per country.

# Owner

Property	                Value
Owner	                    3-of-5 Multisig Wallet
Implementation	          OpenZeppelin UUPSUpgradeable + Ownable2Step
Transfer	                Only 3-of-5 can transfer via governance proposal
Caller (executePayout)	  TreasuryController only
Direct Admin Control	    Multisig can set daily/monthly limits

Access Control Matrix:

Function                      | Caller              | Requires
initialize                    | Constructor         | Called once
executePayout                 | TreasuryController  | Valid order + signatures
setDailyLimit                 | Owner (multisig)    | Multisig signature
setMonthlyLimit               | Owner (multisig)    | Multisig signature
All getters                   | Anyone              | None (view)
_authorizeUpgrade             | Owner (multisig)    | Multisig signature (via governance)

Payout Limits (Set by Multisig):

US Payouts:
  - Daily limit: 100,000 USDC
  - Monthly limit: 1,000,000 USDC

MX Payouts:
  - Daily limit: 50,000 USDC
  - Monthly limit: 500,000 USDC

BR Payouts:
  - Daily limit: 30,000 USDC
  - Monthly limit: 300,000 USDC

Execution Flow:

TreasuryController.executeOrder(order, signatures, fromWallet)
         │
         └─► TreasuryController._executePayout(order, fromWallet)
                   │
                   └─► PayoutExecutor.executePayout(orderId, recipient, amount, country)
                           │
                           ├─► Check: amount + dailySum[country] ≤ dailyLimit
                           ├─► Check: amount + monthlySum[country] ≤ monthlyLimit
                           │
                           ├─► If both checks pass:
                           │     ├─► dailySum[country] += amount
                           │     ├─► monthlySum[country] += amount
                           │     └─► Emit: PayoutExecuted(orderId, ...)
                           │
                           └─► If check fails:
                                 └─► Revert: ExceedsDailyLimit OR ExceedsMonthlyLimit

Multisig Can Override (Special Case):

If limit too restrictive, multisig calls setDailyLimit(country, newLimit)
Requires multisig signature (standard admin function)
Cannot bypass the limit without explicitly changing it first

# State Variables:

struct PayoutRequest {
    bytes32 orderId;
    address recipient;
    uint256 amount;
    string country;
    uint256 timestamp;
    PayoutStatus status;
}

enum PayoutStatus { PENDING, EXECUTED, FAILED, CANCELLED }

mapping(bytes32 => PayoutRequest) public payoutRequests;
mapping(string => mapping(uint256 => uint256)) public dailyPayoutSum; // country → day → sum
mapping(string => mapping(uint256 => uint256)) public monthlyPayoutSum; // country → month → sum
mapping(string => uint256) public dailyPayoutLimit; // e.g., 100K USDC
mapping(string => uint256) public monthlyPayoutLimit; // e.g., 500K USDC

address public treasuryController;
Core Functions:

Function	Inputs	Outputs	Access	Behavior
initialize	owner, treasuryController	—	Constructor	Sets treasury controller address
executePayout	orderId, recipient, amount, country	—	TreasuryController	Validates daily/monthly limits, executes payout; emits PayoutExecuted
setDailyLimit	country, limit	—	Owner	Sets per-country daily cap
setMonthlyLimit	country, limit	—	Owner	Sets per-country monthly cap
getDailyPayoutSum	country, dayTimestamp	uint256	Public	Returns payouts executed on day
getMonthlyPayoutSum	country, monthTimestamp	uint256	Public	Returns payouts executed in month
canExecutePayout	country, amount	bool	Public	Returns true if within limits
getPayoutRequest	orderId	PayoutRequest	Public	Returns payout details
_authorizeUpgrade	newImplementation	—	Owner	Guards upgrade permission
Error Handling:

ExceedsDailyLimit: Payout would exceed daily cap
ExceedsMonthlyLimit: Payout would exceed monthly cap
InvalidCountry: Country not configured
PayoutAlreadyExecuted: Duplicate execution attempt

## 8. RebalancingExecutor (UUPS Upgradeable, Ownable2Step)

# Purpose: Execute rebalance orders across country wallets.

# Owner

Property	                  Value
Owner	                      3-of-5 Multisig Wallet
Implementation	            OpenZeppelin UUPSUpgradeable + Ownable2Step
Transfer	                  Only 3-of-5 can transfer via governance proposal
Caller (executeRebalance)	  TreasuryController only
Direct Admin Control	      Multisig can add/remove country wallets & set schedules

Access Control Matrix:

Function                      | Caller              | Requires
initialize                    | Constructor         | Called once
executeRebalance              | TreasuryController  | Valid order + signatures
addCountryWallet              | Owner (multisig)    | Multisig signature
removeCountryWallet           | Owner (multisig)    | Multisig signature
setRebalanceSchedule          | Owner (multisig)    | Multisig signature
All getters                   | Anyone              | None (view)
_authorizeUpgrade             | Owner (multisig)    | Multisig signature (via governance)

Country Configuration (Set by Multisig):

US Wallet:
  - Address: 0xUS...
  - Target balance: 600,000 USDC
  - Max balance: 1,000,000 USDC
  - Rebalance frequency: Daily (86400 seconds)

MX Wallet:
  - Address: 0xMX...
  - Target balance: 250,000 USDC
  - Max balance: 500,000 USDC
  - Rebalance frequency: Daily

BR Wallet:
  - Address: 0xBR...
  - Target balance: 150,000 USDC
  - Max balance: 300,000 USDC
  - Rebalance frequency: Daily

Execution Flow:

TreasuryController.executeOrder(order, signatures, fromWallet)
         │
         └─► TreasuryController._executeRebalance(order, fromWallet)
                   │
                   └─► RebalancingExecutor.executeRebalance(
                         orderId, sourceCountry, targetCountry, amount)
                           │
                           ├─► Check: sourceWallet.balance ≥ amount
                           ├─► Check: targetWallet.balance + amount ≤ maxBalance
                           ├─► Check: lastRebalanceAt + frequency ≤ now
                           │
                           ├─► If all checks pass:
                           │     ├─► Transfer amount from source to target
                           │     ├─► lastRebalanceAt[targetCountry] = now
                           │     └─► Emit: RebalanceExecuted(...)
                           │
                           └─► If check fails:
                                 └─► Revert: InsufficientBalance OR ExceedsMaxBalance

# State Variables:

struct CountryWallet {
    string country;
    address walletAddress;
    uint256 targetBalance; // USDC equivalent
    bool active;
}

struct RebalanceSchedule {
    string country;
    uint256 lastRebalanceAt;
    uint256 rebalanceFrequencySeconds; // e.g., 86400 = daily
    bool active;
}

mapping(string => CountryWallet) public countryWallets;
mapping(string => RebalanceSchedule) public rebalanceSchedules;
string[] public allCountries;

address public treasuryController;
Core Functions:

Function	            Inputs	                                        Outputs	          Access	              Behavior
initialize	          owner, treasuryController	                      —	                Constructor	          Sets treasury controller
executeRebalance	    orderId, sourceCountry, targetCountry, amount 	—	                TreasuryController	  Moves funds; validates source has sufficient balance
addCountryWallet	    country, walletAddress, targetBalance	          —	                Owner	                Registers country wallet
removeCountryWallet	  country	                                        —	                Owner	                Deactivates country wallet
setRebalanceSchedule	country, frequencySeconds	                      —	                Owner	                Sets rebalance frequency (e.g., daily)
canRebalance	        country	                                        bool	            Public	              Returns true if enough time elapsed since last rebalance
getAllCountries	      —	                                              string[]	        Public	              Returns all country keys
getCountryWallet	    country	                                        CountryWallet	    Public	              Returns wallet details
_authorizeUpgrade	    newImplementation	                              —	                Owner	                Guards upgrade permission

Error Handling:

CountryNotFound: Country wallet not registered
InsufficientBalance: Source wallet has < amount
RebalanceTooFrequent: Last rebalance too recent

## 9. StakingExecutor (UUPS Upgradeable, Ownable2Step)

# Purpose: Execute staking/unstaking orders and track positions.

# Owner

Property	                          Value
Owner	                              3-of-5 Multisig Wallet
Implementation	                    OpenZeppelin UUPSUpgradeable + Ownable2Step
Transfer	                          Only 3-of-5 can transfer via governance proposal
Caller (executeStaking/Unstaking)	  TreasuryController only
Direct Admin Control	              Multisig can set country allocations

Access Control Matrix:

Function                      | Caller              | Requires
initialize                    | Constructor         | Called once
executeStaking                | TreasuryController  | Valid order + signatures
executeUnstaking              | TreasuryController  | Valid order + signatures
setCountryAllocation          | Owner (multisig)    | Multisig signature
All getters                   | Anyone              | None (view)
_authorizeUpgrade             | Owner (multisig)    | Multisig signature (via governance)

Staking Allocation (Set by Multisig):

US:  30% of funds staked (e.g., 600K × 0.30 = 180K staked)
MX:  20% of funds staked
BR:  15% of funds staked
Global: Remaining in cash (liquid for payouts)

Execution Flow:

TreasuryController.executeOrder(order, signatures, fromWallet)
         │
         └─► TreasuryController._executeStaking(order, fromWallet)
                   │
                   └─► StakingExecutor.executeStaking(
                         orderId, amount, country, lockDurationSeconds)
                           │
                           ├─► Check: amount ≤ country allocation × countryBalance
                           ├─► Check: lockDuration > now (valid future unlock)
                           │
                           ├─► If valid:
                           │     ├─► Call stakingPool.deposit(amount)
                           │     ├─► Record position (staker, amount, unlockTime)
                           │     ├─► Emit: StakingExecuted(positionId, ...)
                           │     └─► Return positionId
                           │
                           └─► If invalid:
                                 └─► Revert: InvalidLockDuration OR ExceedsAllocation

# State Variables:

struct StakingPosition {
    bytes32 positionId;
    address staker;
    uint256 amount;
    address stakedToken; // e.g., MATIC, LSD
    string country;
    uint256 stakingStartTime;
    uint256 unlockTime; // 0 = no lock
    bool active;
}

mapping(bytes32 => StakingPosition) public stakingPositions;
mapping(string => uint256) public countryStakingAllocation; // % of funds to stake per country
mapping(address => bytes32[]) public stakerPositions; // staker → position IDs

address public treasuryController;
address public stakingPool; // e.g., Lido stMATIC

Core Functions:

Function	                    Inputs	                                          Outputs	          Access	              Behavior
initialize	                  owner, treasuryController, stakingPool	          —	                Constructor	          Sets treasury and staking pool
executeStaking	              orderId, amount, country, lockDurationSeconds	    positionId	      TreasuryController	  Stakes tokens; records position; emits StakingExecuted
executeUnstaking	            positionId	                                      —	                TreasuryController	  Unstakes; enforces lock if active; emits UnstakingExecuted
setCountryAllocation	        country, allocationPercent	                      —	                Owner	                Sets % of country funds to stake
getStakingPosition	          positionId	                                      StakingPosition	  Public	              Returns position details
getStakerPositions	          staker	                                          bytes32[]	        Public	              Returns all positions for staker
getCountryStakingAllocation	  country	                                          uint256	          Public	              Returns allocation %
_authorizeUpgrade	            newImplementation	                                —	                Owner	                Guards upgrade permission

Error Handling:

InvalidLockDuration: Lock time in past
PositionLocked: Cannot unstake before unlock time
StakingFailed: Pool interaction failed

## Centralized Ownership Matrix (Summary Table)

Contract	                  Owner	            Upgradeable	  Transfer Allowed	Governance  Gate	          Direct Multisig
TreasuryDeploymentFactory	  Deployer	        No	          No                (sealed)	  N/A	            N/A
VariableTimelockController	3-of-5 Multisig	  No	          Yes               (proposal)	CRITICAL (24h)	✓
GovernanceTokenV2	          3-of-5 Multisig	  Yes	          Yes               (proposal)	CRITICAL (24h)	✓ Mint request
UpgradeGovernor	            3-of-5 Multisig	  Yes	          Yes               (proposal)	CRITICAL (24h)	✓ Upgrade auth
DynamicValidatorRegistry	  3-of-5 Multisig	  Yes	          Yes               (proposal)	CRITICAL (24h)	✓ Add/remove
TreasuryController	        3-of-5 Multisig	  Yes	          Yes               (proposal)	CRITICAL (24h)	✓ Authorize agent
GasRefiller	                3-of-5 Multisig	  Yes	          Yes               (proposal)	CRITICAL (24h)	✓ Refill, swap
PayoutExecutor	            3-of-5 Multisig	  Yes	          Yes               (proposal)	CRITICAL (24h)	✓ Set limits
RebalancingExecutor	        3-of-5 Multisig	  Yes	          Yes               (proposal)	CRITICAL (24h)	✓ Add countries
StakingExecutor	            3-of-5 Multisig	  Yes	          Yes               (proposal)	CRITICAL (24h)	✓ Set allocation

# Key Principles

1. Single Owner: 3-of-5 Multisig
- All contracts owned by one multisig wallet address
- No individual validators own contracts
- No AI agents own contracts
- Eliminates key-person risk via multisig requirement

2. Governance Gate for Ownership Transfer
- Old Multisig ──(wants to transfer ownership)──→ New Multisig
         │
         └──► Propose ownership transfer via UpgradeGovernor
                   │
                   ├─► 7-day voting (all 5 validators vote)
                   ├─► Queue in timelock (24h CRITICAL delay)
                   └─► Execute: transferOwnership(newMultisig)
- Ensures no single person can steal all contracts
- Requires community (5 validators) to approve
- minimum delay (7 days + 24 hours)

3. Upgrades via Governance (CRITICAL, 24h Timelock)
- ll UUPS contracts upgradeable
- Only multisig can authorize upgrade
- But multisig must go through governance + 24h delay
- Exception: Emergency pause (EMERGENCY, 0h delay, multisig-only)

4. Direct Admin Actions (No Governance)
These are routine operational tasks; can be done immediately by multisig:

✓ Add/remove validators
✓ Authorize AI agents
✓ Set country wallet limits
✓ Adjust fee thresholds
✓ Register gas reserves
✓ Pause/unpause operations (except for code changes)

5. AI Agents ≠ Owners
- AI agents are authorized to execute orders, not own contracts
- Authorization is explicit: authorizeAgent(0xAI...)
- Can be revoked: revokeAgent(0xAI...)
- Cannot perform admin functions

6. Validator Signers ≠ Owners

- Validators sign orders off-chain (EIP-712)
- Do not hold ownership of any contract
- Own governance tokens (voting power), not contracts
- If validator key compromised, blacklist + token burn, then governance replaces

# Emergency Scenarios & Ownership Actions

Scenario A: Validator Key Compromised
Immediate (No Governance, 0h delay):

- Multisig calls DynamicValidatorRegistry.updateValidatorStatus(validatorId, BLACKLISTED)
- Validator removed from active list
- Orders requiring signatures now need 3-of-4 remaining validators

Governance (Optional, for formal record):

- Create proposal: "Blacklist compromised validator"
- Vote (7 days)
- Queue (24h delay)
- Execute (same result, but documented on-chain)

Scenario B: Critical Bug in TreasuryController
Immediate (0h delay):

- Multisig calls TreasuryController.pause()
- All executeOrder() calls revert
- System operational pause

Fix & Upgrade (31+ hours):

- Developers deploy patched implementation
- ultisig proposes upgrade via Governor
- Vote (7 days)
- Queue (24h CRITICAL delay)
- Execute: upgradeToAndCall(newImpl, initData)

Scenario C: Multisig Member Resigns
Setup New Multisig (31+ hours):

- 3-of-5 remaining members propose: "Transfer ownership to 4-of-5 new multisig"
- Create new multisig with 4 remaining + 1 new member
- Propose via Governor
- Vote (7 days)
- Queue (24h delay)
- Execute: transferOwnership(newMultisig)

Scenario D: Governance Token Stolen
Revoke Voting Power (Immediate, multisig-only):

- Multisig calls GovernanceToken.requestBlacklist(thief, "Stolen tokens")
- Multisig calls GovernanceToken.executeBlacklist(...)
- Stolen tokens burned
- Thief's voting power removed
- Cannot participate in votes or delegate

## Frontend Admin Dashboard: Ownership Control Panel

# Validators Tab

Validator          | Wallet              | Status   | TGV    | Vote %
─────────────────────────────────────────────────────────────────────
CEO                | 0xCEO...            | ACTIVE   | 200K   | 20%
CFO                | 0xCFO...            | ACTIVE   | 200K   | 20%
Compliance         | 0xCOM...            | ACTIVE   | 200K   | 20%
Tech Lead          | 0xTECH...           | ACTIVE   | 200K   | 20%
Auditor            | 0xAUD...            | ACTIVE   | 200K   | 20%

Actions:
┌──────────────────────┬─────────────────┬──────────────────┐
│ Add Validator        │ Governance      │ ROUTINE (4h)     │
│ Remove Validator     │ Governance      │ CRITICAL (24h)   │
│ Blacklist (Emergency)│ Multisig Direct │ EMERGENCY (0h)   │
│ Update Threshold     │ Governance      │ IMPORTANT (12h)  │
└──────────────────────┴─────────────────┴──────────────────┘

# Ownership Tab

Contract                   | Owner            | Upgradeable | Action
──────────────────────────────────────────────────────────────────────
VariableTimelockController │ 0xMultisig...   │ No          │ View
GovernanceTokenV2          │ 0xMultisig...   │ Yes         │ Upgrade
UpgradeGovernor            │ 0xMultisig...   │ Yes         │ Upgrade
DynamicValidatorRegistry   │ 0xMultisig...   │ Yes         │ Upgrade
TreasuryController         │ 0xMultisig...   │ Yes         │ Upgrade
GasRefiller                │ 0xMultisig...   │ Yes         │ Upgrade
PayoutExecutor             │ 0xMultisig...   │ Yes         │ Upgrade
RebalancingExecutor        │ 0xMultisig...   │ Yes         │ Upgrade
StakingExecutor            │ 0xMultisig...   │ Yes         │ Upgrade

Actions:
┌──────────────────────────────────────┐
│ Propose Ownership Transfer           │
│ (to new multisig)                    │
│ → 7-day vote (until threshold)       │
│           + 24h timelock             │
└──────────────────────────────────────┘

# Agents Tab

AI Agent              | Authorized | Authorized At | Action
───────────────────────────────────────────────────────────
0x0123456789...      | Yes        | 2025-05-16    | Revoke
0x9876543210...      | Yes        | 2025-05-10    | Revoke
0xabcdef...          | No         | —             │ Authorize

Actions:
┌──────────────────┬──────────────┐
│ Authorize New    │ Direct       │
│ Revoke Existing  │ Direct       │
└──────────────────┴──────────────┘

# Emergency Control Tab

┌──────────────────────────────────────────────────────┐
│  ⚠ EMERGENCY ACTIONS (0h delay, Multisig only)      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ [PAUSE ALL OPERATIONS]                              │
│  → TreasuryController.pause()                        │
│  → Blocks all executeOrder() calls                   │
│  → No timelock, immediate effect                     │
│                                                      │
│ [BLACKLIST VALIDATOR]                               │
│  → DynamicValidatorRegistry.updateValidatorStatus   │
│  → Remove from active signers immediately           │
│  → Optional: follow with governance for record      │
│                                                      │
│ [REFILL EMERGENCY GAS]                              │
│  → GasRefiller.refillContractGas(contract, amount)  │
│  → Manual top-up if auto-refill fails               │
│                                                      │
└──────────────────────────────────────────────────────┘

## Ownership Change Request Template (Governance)

Type: Ownership Transfer (Severe Impact) Severity: CRITICAL (24h timelock) Required Vote: 3-of-5 FOR (multisig can self-approve)

Proposal Template:

# Title: Transfer Treasury Ownership to New 3-of-5 Multisig

Description:
Due to [reason: key compromise / multisig member departure / system migration],
transfer ownership of all treasury contracts from current multisig (0xOld...) 
to new multisig (0xNew...) composed of:
- New CEO (0xNewCEO...)
- New CFO (0xNewCFO...)
- Compliance Officer (0xNewCom...)
- Technical Lead (0xNewTech...)
- External Auditor (0xNewAud...)

Actions:
1. VariableTimelockController.transferOwnership(0xNew...)
2. GovernanceTokenV2.transferOwnership(0xNew...)
3. UpgradeGovernor.transferOwnership(0xNew...)
4. DynamicValidatorRegistry.transferOwnership(0xNew...)
5. TreasuryController.transferOwnership(0xNew...)
6. GasRefiller.transferOwnership(0xNew...)
7. PayoutExecutor.transferOwnership(0xNew...)
8. RebalancingExecutor.transferOwnership(0xNew...)
9. StakingExecutor.transferOwnership(0xNew...)

Timeline:
- Proposed: [date] 14:00 UTC
- Voting Period: 7 days
- Queued: until threshold is reached or 7 days
- Timelock Delay: 24 hours
- Execution: [date + threshold time + 24h]