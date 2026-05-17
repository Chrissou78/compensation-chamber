// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

contract GovernanceTokenV2 is ERC20Upgradeable, ERC20VotesUpgradeable, ERC20BurnableUpgradeable, ERC20PermitUpgradeable, Ownable2StepUpgradeable, UUPSUpgradeable {
    uint256 public constant MAX_SUPPLY = 1_000_000e18;
    
    enum ValidatorStatus { ACTIVE, BLACKLISTED }
    
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
    
    mapping(address => bool) public blacklist;
    mapping(address => uint256) public blacklistTimestamp;
    mapping(bytes32 => MintRequest) public mintRequests;
    mapping(bytes32 => BlacklistRequest) public blacklistRequests;
    
    bytes32[] public mintRequestIds;
    bytes32[] public blacklistRequestIds;
    uint256 public totalMintRequested;
    uint256 public totalBlacklistRequests;
    
    event MintRequested(bytes32 indexed requestId, address indexed recipient, uint256 amount, string reason, uint256 timestamp);
    event MintExecuted(bytes32 indexed requestId, address indexed recipient, uint256 amount, bytes32 indexed governanceProposalId, uint256 timestamp);
    event MintCancelled(bytes32 indexed requestId, address indexed recipient, uint256 amount, string reason, uint256 timestamp);
    event BlacklistRequested(bytes32 indexed requestId, address indexed account, string reason, uint256 timestamp);
    event BlacklistExecuted(bytes32 indexed requestId, address indexed account, bytes32 indexed governanceProposalId, uint256 burntAmount, uint256 timestamp);
    event AddressBlacklisted(address indexed account, string reason, uint256 timestamp);
    event AddressUnblacklisted(address indexed account, uint256 timestamp);
    event BlacklistRemovalProposed(bytes32 indexed requestId, address indexed account, string reason, uint256 timestamp);
    
    error MintExceedsMaxSupply(uint256 totalSupply, uint256 amount, uint256 maxSupply);
    error RecipientBlacklisted(address recipient);
    error SenderBlacklisted(address sender);
    error RecipientBlacklistedTransfer(address recipient);
    error DelegateeBlacklisted(address delegatee);
    error RequestNotFound(bytes32 requestId);
    error RequestAlreadyExecuted(bytes32 requestId);
    error InsufficientBalance(address account);
    error AddressNotBlacklisted(address account);
    error InvalidAmount(uint256 amount);
    error InvalidRecipient();
    error InvalidAccount();
    
    constructor() {_disableInitializers();}

    function initialize(address owner) external initializer {
        __ERC20_init("Treasury Governance Token", "TGV");
        __ERC20Votes_init();
        __ERC20Burnable_init();
        __ERC20Permit_init("Treasury Governance Token");
        __Ownable_init(owner);
        __Ownable2Step_init();
        __UUPSUpgradeable_init();
    }

    function requestMint(address recipient, uint256 amount, string calldata reason) external onlyOwner returns (bytes32) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(!blacklist[recipient], "Recipient blacklisted");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(bytes(reason).length > 0, "Reason required");
        
        bytes32 requestId = keccak256(abi.encode(recipient, amount, reason, block.timestamp, msg.sender));
        require(mintRequests[requestId].recipient == address(0), "Request already exists");
        
        mintRequests[requestId] = MintRequest({recipient: recipient, amount: amount, reason: reason, requestedAt: block.timestamp, executed: false, governanceProposalId: bytes32(0)});
        mintRequestIds.push(requestId);
        totalMintRequested += amount;
        
        emit MintRequested(requestId, recipient, amount, reason, block.timestamp);
        
        return requestId;
    }

    function executeMint(bytes32 requestId, bytes32 proposalId) external onlyOwner {
        MintRequest storage request = mintRequests[requestId];
        require(request.recipient != address(0), "Request not found");
        require(!request.executed, "Request already executed");
        require(totalSupply() + request.amount <= MAX_SUPPLY, "Exceeds max supply");
        require(proposalId != bytes32(0), "Invalid proposal ID");
        
        request.executed = true;
        request.governanceProposalId = proposalId;
        totalMintRequested -= request.amount;
        
        if (blacklist[request.recipient]) { blacklist[request.recipient] = false; emit AddressUnblacklisted(request.recipient, block.timestamp); }
        _mint(request.recipient, request.amount);
        
        emit MintExecuted(requestId, request.recipient, request.amount, proposalId, block.timestamp);
    }

    function cancelMintRequest(bytes32 requestId, string calldata reason) external onlyOwner {
        MintRequest storage request = mintRequests[requestId];
        require(request.recipient != address(0), "Request not found");
        require(!request.executed, "Request already executed");
        require(bytes(reason).length > 0, "Reason required");
        
        uint256 amount = request.amount;
        request.executed = true;
        totalMintRequested -= amount;
        
        emit MintCancelled(requestId, request.recipient, amount, reason, block.timestamp);
    }

    function requestBlacklist(address account, string calldata reason) external onlyOwner returns (bytes32) {
        require(account != address(0), "Invalid account");
        require(!blacklist[account], "Already blacklisted");
        require(bytes(reason).length > 0, "Reason required");
        require(account != owner(), "Cannot blacklist owner");
        
        bytes32 requestId = keccak256(abi.encode(account, reason, block.timestamp, msg.sender));
        require(blacklistRequests[requestId].account == address(0), "Request already exists");
        
        blacklistRequests[requestId] = BlacklistRequest({account: account, reason: reason, requestedAt: block.timestamp, executed: false, governanceProposalId: bytes32(0)});
        blacklistRequestIds.push(requestId);
        totalBlacklistRequests++;
        
        emit BlacklistRequested(requestId, account, reason, block.timestamp);
        
        return requestId;
    }

    function executeBlacklist(bytes32 requestId, bytes32 proposalId) external onlyOwner {
        BlacklistRequest storage request = blacklistRequests[requestId];
        require(request.account != address(0), "Request not found");
        require(!request.executed, "Request already executed");
        require(proposalId != bytes32(0), "Invalid proposal ID");
        
        address account = request.account;
        request.executed = true;
        request.governanceProposalId = proposalId;
        
        blacklist[account] = true;
        blacklistTimestamp[account] = block.timestamp;
        
        uint256 balance = balanceOf(account);
        if (balance > 0) { _burn(account, balance); }
        _delegates[account] = address(0);
        
        emit BlacklistExecuted(requestId, account, proposalId, balance, block.timestamp);
        emit AddressBlacklisted(account, request.reason, block.timestamp);
    }

    function requestBlacklistRemoval(address account, string calldata reason) external onlyOwner returns (bytes32) {
        require(account != address(0), "Invalid account");
        require(blacklist[account], "Address not blacklisted");
        require(bytes(reason).length > 0, "Reason required");
        
        bytes32 requestId = keccak256(abi.encode(account, "REMOVAL", reason, block.timestamp, msg.sender));
        blacklistRequests[requestId] = BlacklistRequest({account: account, reason: reason, requestedAt: block.timestamp, executed: false, governanceProposalId: bytes32(0)});
        blacklistRequestIds.push(requestId);
        
        emit BlacklistRemovalProposed(requestId, account, reason, block.timestamp);
        
        return requestId;
    }

    function removeFromBlacklist(address account) external onlyOwner {
        require(account != address(0), "Invalid account");
        require(blacklist[account], "Not blacklisted");
        blacklist[account] = false;
        emit AddressUnblacklisted(account, block.timestamp);
    }

    function isBlacklisted(address account) external view returns (bool) {return blacklist[account];}
    function getBlacklistTimestamp(address account) external view returns (uint256) {return blacklistTimestamp[account];}

    function getPendingMintRequests() external view returns (MintRequest[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < mintRequestIds.length; i++) {if (!mintRequests[mintRequestIds[i]].executed) {count++;}}
        
        MintRequest[] memory result = new MintRequest[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < mintRequestIds.length; i++) {if (!mintRequests[mintRequestIds[i]].executed) {result[index] = mintRequests[mintRequestIds[i]]; index++;}}
        return result;
    }

    function getPendingBlacklistRequests() external view returns (BlacklistRequest[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < blacklistRequestIds.length; i++) {if (!blacklistRequests[blacklistRequestIds[i]].executed) {count++;}}
        
        BlacklistRequest[] memory result = new BlacklistRequest[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < blacklistRequestIds.length; i++) {if (!blacklistRequests[blacklistRequestIds[i]].executed) {result[index] = blacklistRequests[blacklistRequestIds[i]]; index++;}}
        return result;
    }

    function getMintRequestIds() external view returns (bytes32[] memory) {return mintRequestIds;}
    function getBlacklistRequestIds() external view returns (bytes32[] memory) {return blacklistRequestIds;}
    function getMintRequest(bytes32 requestId) external view returns (MintRequest memory) {return mintRequests[requestId];}
    function getBlacklistRequest(bytes32 requestId) external view returns (BlacklistRequest memory) {return blacklistRequests[requestId];}
    function getTotalMinted() external view returns (uint256) {return totalSupply();}
    function getRemainingMintCapacity() external view returns (uint256) {return MAX_SUPPLY - totalSupply();}
    function getBlacklistedAddresses() external view returns (address[] memory) {revert("Use event logs for blacklist enumeration");}

    function _update(address from, address to, uint256 value) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        if (from != address(0)) { require(!blacklist[from], "Sender blacklisted"); }
        if (to != address(0)) { require(!blacklist[to], "Recipient blacklisted"); }
        super._update(from, to, value);
    }

    function delegate(address delegatee) public override(ERC20VotesUpgradeable) {
        require(!blacklist[delegatee], "Delegatee blacklisted");
        super.delegate(delegatee);
    }

    function nonces(address owner) public view override(ERC20PermitUpgradeable, NoncesUpgradeable) returns (uint256) {return super.nonces(owner);}
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}