// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

interface IUniswapV3Router {
    struct ExactInputSingleParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }
    
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);}

contract GasRefiller is Ownable2StepUpgradeable, UUPSUpgradeable {
    
    struct ManagedWallet {
        address wallet;
        string country;
        uint256 maxBalance;
        bool active;
    }
    
    struct ContractGasReserve {
        address contractAddress;
        uint256 targetMatic;
        uint256 thresholdMatic;
        bool active;
    }
    
    address public swapRouter;
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
    uint256 public slippageTolerance = 100; // 1% in bps
    
    event WalletAdded(address indexed wallet, string country, uint256 maxBalance);
    event WalletRemoved(address indexed wallet);
    event ContractRegistered(address indexed contract_, uint256 targetMatic, uint256 thresholdMatic);
    event ContractRefilled(address indexed contract_, uint256 maticsReceived, uint256 newBalance);
    event FeesSwapped(address indexed token, uint256 amountIn, uint256 maticsOut);
    event FeeCollected(address indexed token, uint256 amount);
    event BalanceRebalanced(address[] wallets, uint256[] newBalances);
    
    error InvalidMaxBalance();
    error WalletNotManaged();
    error InvalidThreshold();
    error SwapFailed(uint256 expectedMin, uint256 received);
    
    constructor() {_disableInitializers();}

    function initialize(address owner, address _router, address _usdc, address _usdt, address _wmatic) external initializer {
        __Ownable_init(owner);
        __Ownable2Step_init();
        __UUPSUpgradeable_init();
        
        swapRouter = _router;
        usdc = _usdc;
        usdt = _usdt;
        wmatic = _wmatic;
    }
    
    function addManagedWallet(address wallet, string calldata country, uint256 maxBalance) external onlyOwner {
        require(wallet != address(0), "Invalid wallet");
        require(maxBalance > 0, "Invalid max balance");
        require(!isWalletManaged[wallet], "Wallet already managed");
        
        managedWallets.push(ManagedWallet({wallet: wallet, country: country, maxBalance: maxBalance, active: true}));
        
        walletIndex[wallet] = managedWallets.length - 1;
        isWalletManaged[wallet] = true;
        
        emit WalletAdded(wallet, country, maxBalance);
    }
    
    function removeManagedWallet(address wallet) external onlyOwner {
        require(isWalletManaged[wallet], "Wallet not managed");
        
        uint256 index = walletIndex[wallet];
        ManagedWallet storage mw = managedWallets[index];
        mw.active = false;
        
        isWalletManaged[wallet] = false;
        
        emit WalletRemoved(wallet);
    }
    
    function registerContractGasReserve(address contract_, uint256 targetMatic, uint256 thresholdMatic) external onlyOwner {
        require(contract_ != address(0), "Invalid contract");
        require(targetMatic > 0, "Invalid target");
        require(thresholdMatic <= targetMatic, "Invalid threshold");
        
        contractGasReserves[contract_] = ContractGasReserve({contractAddress: contract_, targetMatic: targetMatic, thresholdMatic: thresholdMatic, active: true});
        registeredContracts.push(contract_);
        emit ContractRegistered(contract_, targetMatic, thresholdMatic);
    }
    
    function needsRefill(address contract_) external view returns (bool) {
        ContractGasReserve storage reserve = contractGasReserves[contract_];
        return contract_.balance < reserve.thresholdMatic;
    }
    
    function refillContractGas(address contract_, uint256 amountMatic) external onlyOwner {
        require(contractGasReserves[contract_].active, "Contract not registered");
        require(address(this).balance >= amountMatic, "Insufficient MATIC");
        
        (bool success, ) = payable(contract_).call{value: amountMatic}("");
        require(success, "Refill failed");
        
        emit ContractRefilled(contract_, amountMatic, contract_.balance);
    }
    
    function swapFeesToMatic(address token, uint256 amount, uint256 minMaticOut) external onlyOwner returns (uint256) {
        require(token == usdc || token == usdt, "Invalid token");
        require(amount > 0, "Invalid amount");
        
        _safeApprove(token, swapRouter, amount);
        bytes memory path = abi.encodePacked(token, uint24(3000), wmatic);
        IUniswapV3Router.ExactInputSingleParams memory params = IUniswapV3Router.ExactInputSingleParams({path: path, recipient: address(this), deadline: block.timestamp + 300, amountIn: amount, amountOutMinimum: minMaticOut});
        
        uint256 amountOut = IUniswapV3Router(swapRouter).exactInputSingle(params);
        require(amountOut >= minMaticOut, "Slippage exceeded");
        
        if (token == usdc) {usdcAccumulated -= amount;}
        else {usdtAccumulated -= amount;}
        emit FeesSwapped(token, amount, amountOut);
        return amountOut;
    }

    function receiveFees(address token, uint256 amount) external {
        require(token == usdc || token == usdt, "Invalid token");
        
        if (token == usdc) {usdcAccumulated += amount;} 
        else {usdtAccumulated += amount;}
        emit FeeCollected(token, amount);
    }
    
    function getActiveManagedWallets() external view returns (ManagedWallet[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < managedWallets.length; i++) {if (managedWallets[i].active) count++;}
        
        ManagedWallet[] memory result = new ManagedWallet[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < managedWallets.length; i++) {
            if (managedWallets[i].active) {
                result[index] = managedWallets[i];
                index++;
            }
        }
        return result;
    }

    function withdrawMatic(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient MATIC");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    function _safeApprove(address token, address spender, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSignature("approve(address,uint256)", spender, amount));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Approve failed");
    }
    
    receive() external payable {}
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner{}
}
