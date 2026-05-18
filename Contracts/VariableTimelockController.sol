// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VariableTimelockController is Ownable, ReentrancyGuard {
    
    enum ActionSeverity { EMERGENCY, CRITICAL, IMPORTANT, ROUTINE }
    
    mapping(ActionSeverity => uint256) public delaysByActionType;
    mapping(bytes32 => uint256) public operationTimestamps;
    mapping(bytes32 => bool) public operationExecuted;
    
    event OperationScheduled(bytes32 indexed operationId, ActionSeverity indexed severity, uint256 delay, uint256 readyTimestamp);
    event OperationExecuted(bytes32 indexed operationId, address indexed target, bytes data);
    event OperationCancelled(bytes32 indexed operationId);
    event ActionDelayUpdated(ActionSeverity indexed severity, uint256 oldDelay, uint256 newDelay);
    event Initialized(address indexed owner, uint256[4] delays);
    
    error OperationNotReady(bytes32 id, uint256 currentTime, uint256 readyTime);
    error OperationAlreadyExecuted(bytes32 id);
    error OperationNotFound(bytes32 id);
    error InvalidDelay(uint256 delay, uint256 maxDelay);
    error CallFailed(address target, bytes data);
    
    constructor() Ownable(msg.sender) {}

    function initialize(address owner, uint256 emergencyDelay, uint256 criticalDelay, uint256 importantDelay, uint256 routineDelay) external initializer {
        require(emergencyDelay == 0, "Emergency delay must be 0");
        require(criticalDelay >= 86400, "Critical delay too short");
        require(importantDelay >= 43200, "Important delay too short");
        require(routineDelay >= 14400, "Routine delay too short");
        
        _transferOwnership(owner);
        
        delaysByActionType[ActionSeverity.EMERGENCY] = emergencyDelay;
        delaysByActionType[ActionSeverity.CRITICAL] = criticalDelay;
        delaysByActionType[ActionSeverity.IMPORTANT] = importantDelay;
        delaysByActionType[ActionSeverity.ROUTINE] = routineDelay;
        
        emit Initialized(owner, [emergencyDelay, criticalDelay, importantDelay, routineDelay]);
    }

    function scheduleWithSeverity(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt, ActionSeverity severity) external onlyOwner nonReentrant returns (bytes32) {
        require(target != address(0), "Invalid target");
        
        bytes32 operationId = keccak256(abi.encode(target, value, data, predecessor, salt, severity));
        require(operationTimestamps[operationId] == 0, "Operation already scheduled");
        require(!operationExecuted[operationId], "Operation already executed");
        
        uint256 delay = delaysByActionType[severity];
        uint256 readyTimestamp = block.timestamp + delay;
        operationTimestamps[operationId] = readyTimestamp;
        
        emit OperationScheduled(operationId, severity, delay, readyTimestamp);
        
        return operationId;
    }

    function execute(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt, ActionSeverity severity) external payable nonReentrant {
        bytes32 operationId = keccak256(abi.encode(target, value, data, predecessor, salt, severity));
        
        require(isOperationReady(operationId), "Operation not ready");
        require(!operationExecuted[operationId], "Operation already executed");
        
        operationExecuted[operationId] = true;
        
        (bool success, ) = target.call{value: value}(data);
        require(success, "Execution reverted");
        
        emit OperationExecuted(operationId, target, data);
    }

    function cancel(bytes32 operationId) external onlyOwner nonReentrant {
        require(isOperationPending(operationId), "Operation not pending");
        operationTimestamps[operationId] = 0;
        emit OperationCancelled(operationId);
    }

    function updateActionDelay(ActionSeverity severity, uint256 newDelay) external onlyOwner {
        require(newDelay <= 30 days, "Delay too long");
        if (severity == ActionSeverity.EMERGENCY) {require(newDelay == 0, "Emergency delay must be 0");}
        
        uint256 oldDelay = delaysByActionType[severity];
        delaysByActionType[severity] = newDelay;
        
        emit ActionDelayUpdated(severity, oldDelay, newDelay);
    }

    function isOperationPending(bytes32 operationId) public view returns (bool) {return operationTimestamps[operationId] > 0 && !operationExecuted[operationId];}

    function isOperationReady(bytes32 operationId) public view returns (bool) {
        uint256 timestamp = operationTimestamps[operationId];
        return timestamp > 0 && block.timestamp >= timestamp && !operationExecuted[operationId];
    }

    function isOperationDone(bytes32 operationId) public view returns (bool) {return operationExecuted[operationId];}
    function getDelayForActionType(ActionSeverity severity) external view returns (uint256) {return delaysByActionType[severity];}

    function timeUntilReady(bytes32 operationId) external view returns (uint256) {
        uint256 timestamp = operationTimestamps[operationId];
        if (timestamp == 0 || block.timestamp >= timestamp) return 0;
        return timestamp - block.timestamp;
    }

    modifier initializer() { _;}
}
