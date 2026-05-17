// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

contract PayoutExecutor is Ownable2StepUpgradeable, UUPSUpgradeable {
    
    enum PayoutStatus { PENDING, EXECUTED, FAILED, CANCELLED }
    
    struct PayoutRequest {
        bytes32 orderId;
        address recipient;
        uint256 amount;
        string country;
        uint256 timestamp;
        PayoutStatus status;
    }
    
    mapping(bytes32 => PayoutRequest) public payoutRequests;
    mapping(string => mapping(uint256 => uint256)) public dailyPayoutSum; // country -> day -> sum
    mapping(string => mapping(uint256 => uint256)) public monthlyPayoutSum; // country -> month -> sum
    mapping(string => uint256) public dailyPayoutLimit; // e.g., 100K USDC
    mapping(string => uint256) public monthlyPayoutLimit; // e.g., 500K USDC
    
    address public treasuryController;
    
    event PayoutExecuted(bytes32 indexed orderId, address indexed recipient, uint256 amount, string country, uint256 timestamp);
    event DailyLimitSet(string indexed country, uint256 newLimit);
    event MonthlyLimitSet(string indexed country, uint256 newLimit);
    
    error ExceedsDailyLimit(string country, uint256 attempted, uint256 limit);
    error ExceedsMonthlyLimit(string country, uint256 attempted, uint256 limit);
    error InvalidCountry();
    error PayoutAlreadyExecuted();
    
    constructor() {_disableInitializers();}

    function initialize(address owner, address _treasuryController) external initializer {
        __Ownable_init(owner);
        __Ownable2Step_init();
        __UUPSUpgradeable_init();
        
        treasuryController = _treasuryController;
    }

    function executePayout(bytes32 orderId, address recipient, uint256 amount, string calldata country) external onlyOwner returns (bool) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(bytes(country).length > 0, "Invalid country");
        require(dailyPayoutLimit[country] > 0, "Country not configured");
        
        PayoutRequest storage request = payoutRequests[orderId];
        require(request.orderId == bytes32(0), "Payout already processed");
        
        uint256 dayKey = block.timestamp / 1 days;
        uint256 monthKey = block.timestamp / 30 days;
        
        uint256 dailyTotal = dailyPayoutSum[country][dayKey] + amount;
        uint256 monthlyTotal = monthlyPayoutSum[country][monthKey] + amount;
        
        require(dailyTotal <= dailyPayoutLimit[country], "Exceeds daily limit");
        require(monthlyTotal <= monthlyPayoutLimit[country], "Exceeds monthly limit");
        
        dailyPayoutSum[country][dayKey] = dailyTotal;
        monthlyPayoutSum[country][monthKey] = monthlyTotal;
        payoutRequests[orderId] = PayoutRequest({orderId: orderId, recipient: recipient, amount: amount, country: country, timestamp: block.timestamp, status: PayoutStatus.EXECUTED});
        
        emit PayoutExecuted(orderId, recipient, amount, country, block.timestamp);
        
        return true;
    }

    function setDailyLimit(string calldata country, uint256 limit) external onlyOwner {
        require(limit > 0, "Invalid limit");
        require(bytes(country).length > 0, "Invalid country");
        
        dailyPayoutLimit[country] = limit;
        emit DailyLimitSet(country, limit);
    }

    function setMonthlyLimit(string calldata country, uint256 limit) external onlyOwner {
        require(limit > 0, "Invalid limit");
        require(bytes(country).length > 0, "Invalid country");
        
        monthlyPayoutLimit[country] = limit;
        emit MonthlyLimitSet(country, limit);
    }

    function getDailyPayoutSum(string calldata country, uint256 dayKey)external view returns (uint256) {return dailyPayoutSum[country][dayKey];}
    function getMonthlyPayoutSum(string calldata country, uint256 monthKey) external view returns (uint256) {return monthlyPayoutSum[country][monthKey];}

    function canExecutePayout(string calldata country, uint256 amount) external view returns (bool) {
        require(dailyPayoutLimit[country] > 0, "Country not configured");
        
        uint256 dayKey = block.timestamp / 1 days;
        uint256 monthKey = block.timestamp / 30 days;
        
        uint256 dailyTotal = dailyPayoutSum[country][dayKey] + amount;
        uint256 monthlyTotal = monthlyPayoutSum[country][monthKey] + amount;
        
        return (dailyTotal <= dailyPayoutLimit[country] && monthlyTotal <= monthlyPayoutLimit[country]);
    }

    function getPayoutRequest(bytes32 orderId) external view returns (PayoutRequest memory) {return payoutRequests[orderId];}
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
