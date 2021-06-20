// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev A mock of UniswapV2 Router02 for testing purposes.
 *
 * All functions (without a "mock" prefix) follow the interface of the real
 * UniswapV2Router02 defined at:
 * https://uniswap.org/docs/v2/smart-contracts/router02/.
 */
contract UniswapRouter {
  function getAmountsOut(uint256 amountIn, address[] calldata path)
    external
    pure
    returns (uint256[] memory amounts)
  {
    // suppress warnings
    path;

    uint256[] memory r = new uint256[](1);
    r[0] = amountIn;

    return r;
  }

  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts) {
    // suppress warnings
    amountOutMin;
    deadline;

    require(IERC20(path[0]).transferFrom(to, address(this), amountIn));
    require(IERC20(path[1]).transfer(to, amountIn));

    uint256[] memory r = new uint256[](2);
    r[0] = amountIn;
    r[1] = amountIn;
    return r;
  }
}
