// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapV3Router {
    struct ExactInputSingleParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut) {
        // Extract input token from first 20 bytes of path
        address tokenIn = address(bytes20(params.path[:20]));

        // Pull input tokens from caller
        IERC20(tokenIn).transferFrom(msg.sender, address(this), params.amountIn);

        // Return 1:1 for simplicity
        amountOut = params.amountIn;

        // Send MATIC to recipient if we have enough
        if (amountOut > 0 && address(this).balance >= amountOut) {
            (bool success, ) = params.recipient.call{value: amountOut}("");
            require(success, "ETH transfer failed");
        }

        return amountOut;
    }

    receive() external payable {}
}
