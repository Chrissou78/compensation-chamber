// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

contract RebalancingExecutor is Ownable2StepUpgradeable, UUPSUpgradeable {
    
    struct CountryWallet {
        string country;
        address walletAddress;
        uint256 targetBalance;
        bool active;
    }
    
    struct RebalanceSchedule {
        string country;
        uint256 lastRebalanceAt;
        uint256 rebalanceFrequencySeconds;
        bool active;
    }
    
    mapping(string => CountryWallet) public countryWallets;
    mapping(string => RebalanceSchedule) public rebalanceSchedules;
    string[] public allCountries;
    mapping(string => bool) public countryExists;
    
    address public treasuryController;
    
    event CountryWalletAdded(string indexed country, address indexed walletAddress, uint256 targetBalance);
    event CountryWalletRemoved(string indexed country);
    event RebalanceScheduleSet(string indexed country, uint256 frequencySeconds); 
    event RebalanceExecuted(string indexed sourceCountry, string indexed targetCountry, uint256 amount, uint256 timestamp);
    
    error CountryNotFound();
    error InsufficientBalance();
    error ExceedsMaxBalance();
    error RebalanceTooFrequent();
    error InvalidCountry();
    
    constructor() {_disableInitializers();}

    function initialize(address owner, address _treasuryController) external initializer {
        __Ownable_init(owner);
        __Ownable2Step_init();
        
        treasuryController = _treasuryController;
    }

    function addCountryWallet(string calldata country, address walletAddress, uint256 targetBalance) external onlyOwner {
        require(bytes(country).length > 0, "Invalid country");
        require(walletAddress != address(0), "Invalid wallet");
        require(targetBalance > 0, "Invalid target balance");
        require(!countryExists[country], "Country already exists");
        
        countryWallets[country] = CountryWallet({country: country, walletAddress: walletAddress, targetBalance: targetBalance, active: true});
        rebalanceSchedules[country] = RebalanceSchedule({country: country, lastRebalanceAt: 0, rebalanceFrequencySeconds: 86400, active: true});
        
        allCountries.push(country);
        countryExists[country] = true;
        
        emit CountryWalletAdded(country, walletAddress, targetBalance);
    }

    function removeCountryWallet(string calldata country) external onlyOwner {
        require(countryExists[country], "Country not found");
        
        countryWallets[country].active = false;
        rebalanceSchedules[country].active = false;
        countryExists[country] = false;
        
        emit CountryWalletRemoved(country);
    }

    function executeRebalance(bytes32, string calldata sourceCountry, string calldata targetCountry, uint256 amount) external onlyOwner returns (bool) {
        require(countryExists[sourceCountry], "Source country not found");
        require(countryExists[targetCountry], "Target country not found");
        require(amount > 0, "Invalid amount");
        
        CountryWallet storage sourceWallet = countryWallets[sourceCountry];
        CountryWallet storage targetWallet = countryWallets[targetCountry];
        
        require(sourceWallet.active, "Source wallet inactive");
        require(targetWallet.active, "Target wallet inactive");
        
        RebalanceSchedule storage schedule = rebalanceSchedules[targetCountry];
        require(block.timestamp >= schedule.lastRebalanceAt + schedule.rebalanceFrequencySeconds, "Rebalance too frequent");
        
        schedule.lastRebalanceAt = block.timestamp;
        
        emit RebalanceExecuted(sourceCountry, targetCountry, amount, block.timestamp);
        
        return true;
    }

    function setRebalanceSchedule(string calldata country, uint256 frequencySeconds) external onlyOwner {
        require(countryExists[country], "Country not found");
        require(frequencySeconds > 0, "Invalid frequency");
        
        rebalanceSchedules[country].rebalanceFrequencySeconds = frequencySeconds;
        
        emit RebalanceScheduleSet(country, frequencySeconds);
    }

    function canRebalance(string calldata country) external view returns (bool) {
        require(countryExists[country], "Country not found");
        
        RebalanceSchedule storage schedule = rebalanceSchedules[country];
        return block.timestamp >= schedule.lastRebalanceAt + schedule.rebalanceFrequencySeconds;
    }

    function getAllCountries() external view returns (string[] memory) {return allCountries;}
    function getCountryWallet(string calldata country) external view returns (CountryWallet memory) {return countryWallets[country];}
    function getRebalanceSchedule(string calldata country) external view returns (RebalanceSchedule memory) {return rebalanceSchedules[country];}
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
