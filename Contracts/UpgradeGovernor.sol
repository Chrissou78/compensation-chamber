// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";
import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";

interface IVariableTimelock {
    enum ActionSeverity { EMERGENCY, CRITICAL, IMPORTANT, ROUTINE }
    function scheduleWithSeverity(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt, ActionSeverity severity) external returns (bytes32);
    function execute(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt, ActionSeverity severity) external payable;
}

contract UpgradeGovernor is GovernorUpgradeable, GovernorSettingsUpgradeable, GovernorCountingSimpleUpgradeable, GovernorVotesUpgradeable, GovernorVotesQuorumFractionUpgradeable, GovernorTimelockControlUpgradeable, UUPSUpgradeable
{
    // ================================================================
    // Constants
    // ================================================================
    
    uint256 public constant PASSAGE_THRESHOLD = 60; // 60% = 3-of-5 threshold
    uint256 public constant QUORUM_PERCENTAGE = 4; // 4% quorum
    
    // ================================================================
    // State Variables
    // ================================================================
    
    IVariableTimelock public variableTimelock;
    
    mapping(uint256 => ProposalState_Extended) public proposalStates;
    
    // ================================================================
    // Structs
    // ================================================================
    
    struct ProposalState_Extended {
        IVariableTimelock.ActionSeverity severity;
        uint256 thresholdReachedAt;
        uint256 readyForExecutionAt;
        bool thresholdMet;
        bool executed;
    }
    
    // ================================================================
    // Events
    // ================================================================
    
    event ProposalCreatedWithSeverity(uint256 indexed proposalId, IVariableTimelock.ActionSeverity indexed severity, string description);
    event ThresholdReached(uint256 indexed proposalId, uint256 timestamp, IVariableTimelock.ActionSeverity severity, uint256 cooldownEndsAt);
    event ProposalReadyForExecution(uint256 indexed proposalId, uint256 timestamp);
    event ProposalExecutedWithCooldown(uint256 indexed proposalId, uint256 timestamp);
    
    // ================================================================
    // Errors
    // ================================================================
    
    error VotingNotStarted();
    error CooldownNotExpired(uint256 timeRemaining);
    error ThresholdNotReached();
    error ProposalAlreadyExecuted();
    error InvalidProposalId();
    
    // ================================================================
    // Constructor & Initialization
    // ================================================================
    
    constructor() {_disableInitializers();}

    function initialize(IVotes token, TimelockControllerUpgradeable timelock, uint48 _votingDelay, uint32 _votingPeriod, uint256 _proposalThreshold) external initializer {
        __Governor_init("Treasury Governor");
        __GovernorSettings_init(_votingDelay, _votingPeriod, _proposalThreshold);
        __GovernorCountingSimple_init();
        __GovernorVotes_init(token);
        __GovernorVotesQuorumFraction_init(QUORUM_PERCENTAGE);
        __GovernorTimelockControl_init(timelock);
    }
    
    // ================================================================
    // Core Functions
    // ================================================================
    
    function proposeWithSeverity(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description, IVariableTimelock.ActionSeverity severity) external returns (uint256) {
        uint256 proposalId = propose(targets, values, calldatas, description);
        proposalStates[proposalId] = ProposalState_Extended({
            severity: severity,
            thresholdReachedAt: 0,
            readyForExecutionAt: 0,
            thresholdMet: false,
            executed: false
        });
        emit ProposalCreatedWithSeverity(proposalId, severity, description);
        return proposalId;
    }
    
    function castVote(uint256 proposalId, uint8 support) public override(GovernorUpgradeable) returns (uint256) {
        uint256 weight = super.castVote(proposalId, support);
        if (!proposalStates[proposalId].thresholdMet) { _checkThresholdReached(proposalId); }
        return weight;
    }
    
    function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason) public override(GovernorUpgradeable) returns (uint256) {
        uint256 weight = super.castVoteWithReason(proposalId, support, reason);
        if (!proposalStates[proposalId].thresholdMet) { _checkThresholdReached(proposalId); }
        return weight;
    }
    
    function executeProposal(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32, uint256 proposalId) external {
        ProposalState_Extended storage pState = proposalStates[proposalId];
        require(pState.thresholdMet, "Threshold not reached");
        require(!pState.executed, "Proposal already executed");
        require(block.timestamp >= pState.readyForExecutionAt, "Cooldown period not expired");
        
        pState.executed = true;
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, ) = targets[i].call{value: values[i]}(calldatas[i]);
            require(success, "Execution reverted");
        }
        emit ProposalExecutedWithCooldown(proposalId, block.timestamp);
    }
    
    // ================================================================
    // Internal Functions
    // ================================================================
    
    function _checkThresholdReached(uint256 proposalId) internal {
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = proposalVotes(proposalId);
        uint256 totalVotes = againstVotes + forVotes + abstainVotes;
        
        if (totalVotes >= 5) {
            uint256 forPercentage = (forVotes * 100) / totalVotes;
            if (forPercentage >= PASSAGE_THRESHOLD) { _onThresholdReached(proposalId); }
        }
    }
    
    function _onThresholdReached(uint256 proposalId) internal {
        ProposalState_Extended storage pState = proposalStates[proposalId];
        require(!pState.thresholdMet, "Threshold already reached");
        
        pState.thresholdMet = true;
        pState.thresholdReachedAt = block.timestamp;
        uint256 cooldownDuration = _getCooldownDuration(pState.severity);
        pState.readyForExecutionAt = block.timestamp + cooldownDuration;
        
        emit ThresholdReached(proposalId, block.timestamp, pState.severity, pState.readyForExecutionAt);
    }
    
    function _getCooldownDuration(IVariableTimelock.ActionSeverity severity) internal pure returns (uint256) {
        if (severity == IVariableTimelock.ActionSeverity.EMERGENCY) { return 0; }
        else if (severity == IVariableTimelock.ActionSeverity.CRITICAL) { return 24 hours; }
        else if (severity == IVariableTimelock.ActionSeverity.IMPORTANT) { return 12 hours; }
        else if (severity == IVariableTimelock.ActionSeverity.ROUTINE) { return 4 hours; }
        return 24 hours;
    }
    
    // ================================================================
    // Query Functions
    // ================================================================
    
    function getProposalState(uint256 proposalId) external view returns (ProposalState_Extended memory) {return proposalStates[proposalId];}
    
    function isReadyForExecution(uint256 proposalId) external view returns (bool) {
        ProposalState_Extended storage pState = proposalStates[proposalId];
        return pState.thresholdMet && !pState.executed && block.timestamp >= pState.readyForExecutionAt;
    }
    
    function timeUntilExecutable(uint256 proposalId) external view returns (uint256) {
        ProposalState_Extended storage pState = proposalStates[proposalId];
        if (!pState.thresholdMet) return type(uint256).max;
        if (pState.executed) return 0;
        if (block.timestamp >= pState.readyForExecutionAt) return 0;
        return pState.readyForExecutionAt - block.timestamp;
    }
    
    function cancelProposal(uint256 proposalId) external onlyGovernance {
        ProposalState_Extended storage pState = proposalStates[proposalId];
        require(!pState.executed, "Cannot cancel executed proposal");
        pState.executed = true;
    }
    
    // ================================================================
    // Required Overrides
    // ================================================================
    
    function votingDelay() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) {return super.votingDelay();}
    function votingPeriod() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) {return super.votingPeriod();}
    function quorum(uint256 blockNumber) public view override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable) returns (uint256) {return super.quorum(blockNumber);}
    function state(uint256 proposalId) public view override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (ProposalState) {return super.state(proposalId);}
    function proposalNeedsQueuing(uint256 proposalId) public view override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (bool) {return super.proposalNeedsQueuing(proposalId);}
    function proposalThreshold() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) {return super.proposalThreshold();}
    function _queueOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (uint48) {return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);}
    function _executeOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) {super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);}
    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (uint256) {return super._cancel(targets, values, calldatas, descriptionHash);}
    function _executor() internal view override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (address) {return super._executor();}
    function supportsInterface(bytes4 interfaceId) public view override(GovernorUpgradeable) returns (bool) {return super.supportsInterface(interfaceId);}
    function _authorizeUpgrade(address newImplementation) internal override onlyGovernance {}
}
