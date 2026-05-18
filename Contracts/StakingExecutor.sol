// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

contract StakingExecutor is Ownable2StepUpgradeable, UUPSUpgradeable {
    
    struct StakingPosition {
        bytes32 positionId;
        address staker;
        uint256 amount;
        address stakedToken; // e.g., MATIC
        string country;
        uint256 stakingStartTime;
        uint256 unlockTime;
        bool active;
    }
    
    mapping(bytes32 => StakingPosition) public stakingPositions;
    mapping(string => uint256) public countryStakingAllocation; // % of funds to stake per country
    mapping(address => bytes32[]) public stakerPositions; // staker -> position IDs
    
    address public treasuryController;
    address public stakingPool; // e.g., Lido stMATIC
    
    event StakingExecuted(bytes32 indexed positionId, address indexed staker, uint256 amount, string country, uint256 unlockTime);
    event UnstakingExecuted(bytes32 indexed positionId, address indexed staker, uint256 amount);
    event CountryAllocationSet(string indexed country, uint256 allocationPercent);
    
    error InvalidLockDuration();
    error PositionLocked();
    error InvalidPosition();
    error ExceedsAllocation();
    
    constructor() {_disableInitializers();}

    function initialize(address owner, address _treasuryController, address _stakingPool) external initializer {
        __Ownable_init(owner);
        __Ownable2Step_init();
        
        treasuryController = _treasuryController;
        stakingPool = _stakingPool;
    }

    function executeStaking(bytes32 orderId, uint256 amount, string calldata country, uint256 lockDurationSeconds) external onlyOwner returns (bytes32) {
        require(amount > 0, "Invalid amount");
        require(bytes(country).length > 0, "Invalid country");
        require(lockDurationSeconds > 0, "Invalid lock duration");
        require(block.timestamp + lockDurationSeconds > block.timestamp, "Invalid unlock time");
        
        bytes32 positionId = keccak256(abi.encode(orderId, msg.sender, amount, block.timestamp));
        uint256 unlockTime = block.timestamp + lockDurationSeconds;
        stakingPositions[positionId] = StakingPosition({positionId: positionId, staker: msg.sender, amount: amount, stakedToken: address(0), country: country, stakingStartTime: block.timestamp, unlockTime: unlockTime, active: true});
        stakerPositions[msg.sender].push(positionId);
        
        emit StakingExecuted(positionId, msg.sender, amount, country, unlockTime);
        
        return positionId;
    }

    function executeUnstaking(bytes32 positionId) external onlyOwner returns (bool) {
        StakingPosition storage position = stakingPositions[positionId];
        
        require(position.positionId != bytes32(0), "Position not found");
        require(position.active, "Position not active");
        require(block.timestamp >= position.unlockTime, "Position locked");
        
        position.active = false;
        
        emit UnstakingExecuted(positionId, position.staker, position.amount);
        
        return true;
    }

    function setCountryAllocation(string calldata country, uint256 allocationPercent) external onlyOwner {
        require(bytes(country).length > 0, "Invalid country");
        require(allocationPercent <= 100, "Invalid allocation");
        
        countryStakingAllocation[country] = allocationPercent;
        
        emit CountryAllocationSet(country, allocationPercent);
    }

    function getStakingPosition(bytes32 positionId)external view returns (StakingPosition memory) {return stakingPositions[positionId];}
    function getStakerPositions(address staker) external view returns (bytes32[] memory) {return stakerPositions[staker];}
    function getCountryAllocation(string calldata country)external view returns (uint256) {return countryStakingAllocation[country];}

    function isPositionLocked(bytes32 positionId) external view returns (bool) {
        StakingPosition storage position = stakingPositions[positionId];
        return position.active && block.timestamp < position.unlockTime;
    }

    function timeUntilUnlock(bytes32 positionId) external view returns (uint256) {
        StakingPosition storage position = stakingPositions[positionId];
        if (!position.active || block.timestamp >= position.unlockTime) {return 0;}
        return position.unlockTime - block.timestamp;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
