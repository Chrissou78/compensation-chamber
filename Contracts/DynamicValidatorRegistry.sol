// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DynamicValidatorRegistry is Ownable2StepUpgradeable, UUPSUpgradeable {
    
    enum ValidatorStatus { ACTIVE, BLACKLISTED }
    enum ActionType { PAYOUT, REBALANCE, STAKING, UPGRADE, PARAMETER_CHANGE, VALIDATOR_ADD, VALIDATOR_REMOVE, BLACKLIST, MINTING, GOVERNANCE }
    
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
    
    uint256 public minValidators;
    uint256 public maxValidators;
    uint256 public configurationVersion;
    
    event ValidatorAdded(bytes32 indexed validatorId, address indexed wallet, string name, string role);
    event ValidatorRemoved(bytes32 indexed validatorId, address indexed wallet);
    event ValidatorStatusChanged(bytes32 indexed validatorId, ValidatorStatus oldStatus, ValidatorStatus newStatus);
    event ThresholdUpdated(ActionType indexed actionType, uint8 oldRequired, uint8 newRequired);
    event ValidatorCountChanged(uint256 newCount, uint256 maxValidators);
    event ConfigurationVersioned(uint256 indexed version, uint256 timestamp, bytes32 snapshotHash);
    
    error MinimumValidatorsRequired(uint256 required, uint256 current);
    error MaximumValidatorsExceeded(uint256 max, uint256 attempted);
    error DuplicateValidator(address wallet);
    error InvalidValidatorWallet();
    error ThresholdExceedsActiveCount(uint8 threshold, uint256 activeCount);
    error ValidatorNotFound();
    
    constructor() {_disableInitializers();}
 
     function initialize(address owner) external initializer {
        __Ownable_init(owner);
        __Ownable2Step_init();
        minValidators = 3;
        maxValidators = 20;
        configurationVersion = 0;
    }

    function addValidator(address wallet, string calldata name, string calldata role) external onlyOwner returns (bytes32) {
        require(wallet != address(0), "Invalid wallet");
        require(validatorIds.length < maxValidators, "Max validators reached");
        require(walletToValidatorId[wallet] == bytes32(0), "Validator already exists");
        
        bytes32 validatorId = keccak256(abi.encode(wallet, block.timestamp, name));
        
        validators[validatorId] = Validator({id: validatorId, wallet: wallet, name: name, role: role, status: ValidatorStatus.ACTIVE, addedAt: block.timestamp, removedAt: 0});
        
        validatorIds.push(validatorId);
        walletToValidatorId[wallet] = validatorId;
        isActiveValidator[wallet] = true;
        activeValidators.push(wallet);
        
        _createSnapshot();
        
        emit ValidatorAdded(validatorId, wallet, name, role);
        emit ValidatorCountChanged(validatorIds.length, maxValidators);
        
        return validatorId;
    }

    function removeValidator(bytes32 validatorId) external onlyOwner {
        Validator storage validator = validators[validatorId];
        require(validator.wallet != address(0), "Validator not found");
        require(activeValidators.length > minValidators, "Minimum validators required");
        
        address wallet = validator.wallet;
        isActiveValidator[wallet] = false;
        validator.status = ValidatorStatus.ACTIVE; // Mark as removed but keep status
        validator.removedAt = block.timestamp;
        
        _removeFromActiveList(wallet);
        
        _createSnapshot();
        
        emit ValidatorRemoved(validatorId, wallet);
        emit ValidatorCountChanged(validatorIds.length, maxValidators);
    }

    function updateValidatorStatus(bytes32 validatorId, ValidatorStatus newStatus) external onlyOwner {
        Validator storage validator = validators[validatorId];
        require(validator.wallet != address(0), "Validator not found");
        
        ValidatorStatus oldStatus = validator.status;
        validator.status = newStatus;
        
        if (newStatus == ValidatorStatus.BLACKLISTED) {
            isActiveValidator[validator.wallet] = false;
            _removeFromActiveList(validator.wallet);
        } else if (newStatus == ValidatorStatus.ACTIVE && validator.removedAt == 0) {
            isActiveValidator[validator.wallet] = true;
            if (!_isInActiveList(validator.wallet)) {
                activeValidators.push(validator.wallet);
            }
        }
        
        _createSnapshot();
        
        emit ValidatorStatusChanged(validatorId, oldStatus, newStatus);
    }
 
    function setActionThreshold(ActionType actionType, uint8 requiredSignatures, string calldata description) external onlyOwner {
        require(requiredSignatures > 0, "Invalid threshold");
        require(requiredSignatures <= activeValidators.length, "Threshold exceeds validators");
        
        ActionThreshold storage threshold = actionThresholds[actionType];
        uint8 oldRequired = threshold.requiredSignatures;
        
        threshold.id = keccak256(abi.encode(actionType, requiredSignatures, block.timestamp));
        threshold.actionType = actionType;
        threshold.requiredSignatures = requiredSignatures;
        threshold.setAt = block.timestamp;
        threshold.description = description;
        threshold.active = true;
        
        _createSnapshot();
        
        emit ThresholdUpdated(actionType, oldRequired, requiredSignatures);
    }

    function getActiveValidators() external view returns (address[] memory) {return activeValidators;}

    function getAllValidators() external view returns (Validator[] memory) {
        Validator[] memory result = new Validator[](validatorIds.length);
        for (uint256 i = 0; i < validatorIds.length; i++) {
            result[i] = validators[validatorIds[i]];
        }
        return result;
    }

    function getValidator(bytes32 validatorId) external view returns (Validator memory) {return validators[validatorId];}

    function getValidatorByWallet(address wallet) external view returns (Validator memory) {
        bytes32 validatorId = walletToValidatorId[wallet];
        return validators[validatorId];
    }
 
    function getRequiredSignatures(ActionType actionType) external view returns (uint8) {return actionThresholds[actionType].requiredSignatures;}
    function getActionThreshold(ActionType actionType) external view returns (ActionThreshold memory) {return actionThresholds[actionType];}
    function getValidatorCount() external view returns (uint256) {return validatorIds.length;}
    function getActiveValidatorCount() external view returns (uint256) {return activeValidators.length;}

    function getConfigurationSnapshot(uint256 version) external view returns (ConfigurationSnapshot memory) {
        require(version < configurationHistory.length, "Invalid version");
        return configurationHistory[version];
    }

    function getConfigurationHistory() external view returns (ConfigurationSnapshot[] memory) {return configurationHistory;}

    function setMinValidators(uint256 newMin) external onlyOwner {
        require(newMin >= 2, "Min too low");
        require(newMin <= activeValidators.length, "Min exceeds current");
        minValidators = newMin;
    }

    function setMaxValidators(uint256 newMax) external onlyOwner {
        require(newMax >= activeValidators.length, "Max below current");
        require(newMax <= 50, "Max too high");
        maxValidators = newMax;
    }

    function _removeFromActiveList(address wallet) internal {
        for (uint256 i = 0; i < activeValidators.length; i++) {
            if (activeValidators[i] == wallet) {
                activeValidators[i] = activeValidators[activeValidators.length - 1];
                activeValidators.pop();
                break;
            }
        }
    }
    
    function _isInActiveList(address wallet) internal view returns (bool) {
        for (uint256 i = 0; i < activeValidators.length; i++) {if (activeValidators[i] == wallet) return true;}
        return false;
    }
    
    function _createSnapshot() internal {bytes32 hash = keccak256(abi.encode(activeValidators, configurationVersion, block.timestamp));
        configurationHistory.push(ConfigurationSnapshot({timestamp: block.timestamp, validatorCount: validatorIds.length, activeCount: uint8(activeValidators.length), snapshotHash: hash, version: configurationVersion}));
        configurationVersion++;
        emit ConfigurationVersioned(configurationVersion - 1, block.timestamp, hash);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
