// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IDynamicValidatorRegistry {
    function getActiveValidators() external view returns (address[] memory);
    function getRequiredSignatures(uint8 actionType) external view returns (uint8);
}

interface IGasRefiller {function receiveFees(address token, uint256 amount) external;}

contract TreasuryController is Ownable2StepUpgradeable, UUPSUpgradeable, ReentrancyGuard {
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
    bytes32 public constant ORDER_TYPEHASH = keccak256("Order(uint8 orderType,address token,uint256 amount,address recipient,uint256 nonce,uint256 deadline)");
    
    mapping(address => bool) public authorizedAgents;
    mapping(bytes32 => bool) public executedOrders;
    mapping(address => uint256) public agentNonce;
    mapping(address => bool) public supportedTokens;
    mapping(address => mapping(address => uint256)) public countryTokenBalance;
    
    address public gasRefiller;
    IDynamicValidatorRegistry public validatorRegistry;
    
    bool public paused;
    
    event OrderExecuted(bytes32 indexed orderId, OrderType indexed orderType, address indexed recipient, uint256 amount, uint256 fee);
    
    event AgentAuthorized(address indexed agent);
    event AgentRevoked(address indexed agent);
    event FeeCollected(address indexed token, uint256 amount);
    event Paused();
    event Unpaused();
    
    error UnauthorizedAgent();
    error InsufficientSignatures(uint256 provided, uint256 required);
    error InvalidSignature();
    error OrderAlreadyExecuted();
    error DeadlineExpired();
    error PausedContract();
    error UnsupportedToken();
    error InsufficientBalance();
    
    constructor() {_disableInitializers();}

    function initialize(address owner, address _validatorRegistry, address _gasRefiller) external initializer {
        __Ownable_init(owner);
        __Ownable2Step_init();
        
        validatorRegistry = IDynamicValidatorRegistry(_validatorRegistry);
        gasRefiller = _gasRefiller;
        
        uint256 chainId;
        assembly {chainId := chainid()}
        DOMAIN_SEPARATOR = keccak256(abi.encode(keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"), keccak256(bytes("TreasuryController")), keccak256(bytes("1")), chainId, address(this)));
    }

    function executeOrder(Order calldata order, bytes[] calldata signatures) external nonReentrant returns (bytes32) {
        require(!paused, "Contract paused");
        require(authorizedAgents[msg.sender], "Unauthorized agent");
        require(order.deadline >= block.timestamp, "Deadline expired");
        require(supportedTokens[order.token], "Unsupported token");
        
        bytes32 orderHash = _getOrderHash(order);
        bytes32 orderId = keccak256(abi.encode(orderHash, block.timestamp));
        
        require(!executedOrders[orderId], "Order already executed");
        
        uint8 requiredSigs = validatorRegistry.getRequiredSignatures(uint8(order.orderType));
        require(signatures.length >= requiredSigs, "Insufficient signatures");
        
        _verifyMultisigSignatures(orderHash, signatures);
        
        executedOrders[orderId] = true;
        agentNonce[msg.sender]++;
        
        uint256 fee = (order.amount * 1) / 1000;
        uint256 netAmount = order.amount - fee;
        
        if (order.orderType == OrderType.PAYOUT) {
            require(countryTokenBalance[order.recipient][order.token] >= order.amount, "Insufficient balance");
            countryTokenBalance[order.recipient][order.token] -= order.amount;
            
            _safeTransfer(order.token, order.recipient, netAmount);
            
            _safeTransfer(order.token, gasRefiller, fee);
            IGasRefiller(gasRefiller).receiveFees(order.token, fee);
        }
        
        emit OrderExecuted(orderId, order.orderType, order.recipient, order.amount, fee);
        emit FeeCollected(order.token, fee);
        
        return orderId;
    }

    function authorizeAgent(address agent) external onlyOwner {
        require(agent != address(0), "Invalid agent");
        authorizedAgents[agent] = true;
        emit AgentAuthorized(agent);
    }

    function revokeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = false;
        emit AgentRevoked(agent);
    }

    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        supportedTokens[token] = true;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }
    
    function setGasRefiller(address _gasRefiller) external onlyOwner {
        require(_gasRefiller != address(0), "Invalid refiller");
        gasRefiller = _gasRefiller;
    }

    function _getOrderHash(Order calldata order) internal view returns (bytes32) {return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, keccak256(abi.encode(ORDER_TYPEHASH, order.orderType, order.token, order.amount, order.recipient, order.nonce, order.deadline))));}
    
    function _verifyMultisigSignatures(bytes32 orderHash, bytes[] calldata signatures) internal view {
        address[] memory activeValidators = validatorRegistry.getActiveValidators();
        require(signatures.length <= activeValidators.length, "Too many signatures");
        
        address lastSigner = address(0);
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ECDSA.recover(orderHash, signatures[i]);
            require(signer > lastSigner, "Invalid signature order"); // Check sorted
            
            bool isActive = false;
            for (uint256 j = 0; j < activeValidators.length; j++) {
                if (activeValidators[j] == signer) {
                    isActive = true;
                    break;
                }
            }
            require(isActive, "Invalid signer");
            lastSigner = signer;
        }
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSignature("transfer(address,uint256)", to, amount));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
