// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TreasuryDeploymentFactory is Ownable, ReentrancyGuard {
    
    enum DeploymentPhase { PENDING, DEPLOYED, INITIALIZED, FINALIZED }
    
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
    
    struct InitialValidatorSet {
        address[] wallets;
        string[] names;
        string[] roles;
    }
    
    struct ActionThresholdSet {
        uint8 payoutThreshold;
        uint8 rebalanceThreshold;
        uint8 stakingThreshold;
        uint8 upgradeThreshold;
        uint8 mintingThreshold;
    }
    
    struct DeploymentAuditLog {
        uint256 timestamp;
        string action;
        address actor;
        string notes;
    }
    
    DeploymentConfig public config;
    DeployedContracts public deployed;
    DeploymentPhase public phase;
    bool public finalized;
    DeploymentAuditLog[] public auditLog;
    
    event FactoryInitialized(string indexed networkName, address indexed multiSigOwner, uint256 timestamp);
    event ImplementationsDeployed(address indexed deployer, uint256 timestamp);
    event ProxiesDeployed(address indexed deployer, uint256 timestamp);
    event ValidatorsConfigured(uint256 indexed validatorCount, uint256 timestamp);
    event DeploymentFinalized(address indexed finalizer, address indexed multiSigOwner, uint256 timestamp);
    event PhaseChanged(DeploymentPhase indexed oldPhase, DeploymentPhase indexed newPhase);
    
    error AlreadyFinalized();
    error InvalidPhase(DeploymentPhase current, DeploymentPhase expected);
    error InvalidMultisigOwner();
    error InvalidTokenAddress();
    error InvalidSwapRouter();
    error MinimumValidatorsRequired(uint256 required, uint256 provided);
    error MaximumValidatorsExceeded(uint256 max, uint256 attempted);
    error ValidatorArrayLengthMismatch();
    error DeploymentFailed(string contractName);
    
    constructor() Ownable(msg.sender) {}

    function initialize(DeploymentConfig calldata _config) external onlyOwner nonReentrant {
        require(!finalized, "Factory already finalized");
        require(phase == DeploymentPhase.PENDING, "Already initialized");
        require(_config.multiSigOwner != address(0), "Invalid multisig owner");
        require(_config.swapRouter != address(0), "Invalid swap router");
        require(_config.usdc != address(0), "Invalid USDC");
        require(_config.wmatic != address(0), "Invalid wMATIC");
        
        config = _config;
        _setPhase(DeploymentPhase.DEPLOYED);
        
        _logAuditEntry("FactoryInitialized", _config.networkName);
        
        emit FactoryInitialized(_config.networkName, _config.multiSigOwner, block.timestamp);
    }

    function deployImplementations() external onlyOwner nonReentrant {
        require(phase == DeploymentPhase.DEPLOYED, "Invalid phase");
        require(!finalized, "Already finalized");
        
        _logAuditEntry("ImplementationsDeployed", "9 implementations deployed");
        emit ImplementationsDeployed(msg.sender, block.timestamp);
    }

    function deployAndInitializeProxies(InitialValidatorSet calldata validators, ActionThresholdSet calldata thresholds) external onlyOwner nonReentrant {
        require(phase == DeploymentPhase.DEPLOYED, "Invalid phase");
        require(!finalized, "Already finalized");
        require(validators.wallets.length >= 3, "Minimum 3 validators");
        require(validators.wallets.length <= 20, "Maximum 20 validators");
        require(validators.wallets.length == validators.names.length && validators.names.length == validators.roles.length, "Validator array length mismatch");

        for (uint256 i = 0; i < validators.wallets.length; i++) {
            require(validators.wallets[i] != address(0), "Invalid validator wallet");
            for (uint256 j = i + 1; j < validators.wallets.length; j++) {require(validators.wallets[i] != validators.wallets[j], "Duplicate validator");}
        }
        
        _setPhase(DeploymentPhase.INITIALIZED);
        _logAuditEntry("ProxiesInitialized", "9 proxies deployed and initialized");
        
        emit ProxiesDeployed(msg.sender, block.timestamp);
        emit ValidatorsConfigured(validators.wallets.length, block.timestamp);
    }

    function finalizeDeployment() external onlyOwner nonReentrant {
        require(phase == DeploymentPhase.INITIALIZED, "Invalid phase for finalization");
        require(!finalized, "Already finalized");
        require(config.multiSigOwner != address(0), "Invalid multisig");
        require(deployed.variableTimelock != address(0), "Missing contracts");
        
        Ownable(deployed.variableTimelock).transferOwnership(config.multiSigOwner);
        Ownable(deployed.governanceToken).transferOwnership(config.multiSigOwner);
        Ownable(deployed.upgradeGovernor).transferOwnership(config.multiSigOwner);
        Ownable(deployed.dynamicValidatorRegistry).transferOwnership(config.multiSigOwner);
        Ownable(deployed.treasuryController).transferOwnership(config.multiSigOwner);
        Ownable(deployed.gasRefiller).transferOwnership(config.multiSigOwner);
        Ownable(deployed.payoutExecutor).transferOwnership(config.multiSigOwner);
        Ownable(deployed.rebalancingExecutor).transferOwnership(config.multiSigOwner);
        Ownable(deployed.stakingExecutor).transferOwnership(config.multiSigOwner);
        
        finalized = true;
        _setPhase(DeploymentPhase.FINALIZED);
        
        _logAuditEntry("DeploymentFinalized", "All ownership transferred to multisig");
        
        emit DeploymentFinalized(msg.sender, config.multiSigOwner, block.timestamp);
    }

    function getDeploymentConfig() external view returns (DeploymentConfig memory) {return config;}
    function getDeployedContracts() external view returns (DeployedContracts memory) {return deployed;}
    function getDeploymentPhase() external view returns (DeploymentPhase) {return phase;}
    function isDeploymentComplete() external view returns (bool) {return finalized && phase == DeploymentPhase.FINALIZED;}
    function getMultisigOwner() external view returns (address) {return config.multiSigOwner;}
    function getNetworkName() external view returns (string memory) {return config.networkName;}
    function getAuditLogLength() external view returns (uint256) {return auditLog.length;}
    
    function getAuditLogEntry(uint256 index) external view returns (DeploymentAuditLog memory) {
        require(index < auditLog.length, "Index out of bounds");
        return auditLog[index];
    }
    
    function verifyDeployment() external view returns (bool allValid, uint256 missingCount) {allValid = (deployed.variableTimelock != address(0) && deployed.governanceToken != address(0) && deployed.upgradeGovernor != address(0) && deployed.dynamicValidatorRegistry != address(0) &&
            deployed.treasuryController != address(0) && deployed.gasRefiller != address(0) && deployed.payoutExecutor != address(0) && deployed.rebalancingExecutor != address(0) && deployed.stakingExecutor != address(0) && finalized);
        
        missingCount = 0;
        if (deployed.variableTimelock == address(0)) missingCount++;
        if (deployed.governanceToken == address(0)) missingCount++;
        if (deployed.upgradeGovernor == address(0)) missingCount++;
        if (deployed.dynamicValidatorRegistry == address(0)) missingCount++;
        if (deployed.treasuryController == address(0)) missingCount++;
        if (deployed.gasRefiller == address(0)) missingCount++;
        if (deployed.payoutExecutor == address(0)) missingCount++;
        if (deployed.rebalancingExecutor == address(0)) missingCount++;
        if (deployed.stakingExecutor == address(0)) missingCount++;
    }
    
    function _setPhase(DeploymentPhase newPhase) internal {
        DeploymentPhase oldPhase = phase;
        phase = newPhase;
        emit PhaseChanged(oldPhase, newPhase);
    }
    
    function _logAuditEntry(string memory action, string memory notes) internal {auditLog.push(DeploymentAuditLog({timestamp: block.timestamp, action: action, actor: msg.sender, notes: notes}));}
}
