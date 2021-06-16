// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AaveDAI.sol";
import "hardhat/console.sol";

/**
 * @dev A mock of the Aave lending pool for testing purposes.
 *
 * All functions (without a "mock" prefix) follow the interface of the real
 * lending pool defined at:
 * https://docs.aave.com/developers/the-core-protocol/lendingpool/ilendingpool.
 */
contract AaveLendingPool {
  AaveDAI public aaveDai;

  constructor() {
    aaveDai = new AaveDAI();
  }

  function deposit(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode
  ) external {
    // supress warnings
    asset;
    onBehalfOf;
    referralCode;

    require(IERC20(asset).transferFrom(msg.sender, address(this), amount));
    aaveDai.mint(onBehalfOf, amount);
  }

  function withdraw(
    address asset,
    uint256 amount,
    address to
  ) external returns (uint256) {
    aaveDai.burn(msg.sender, amount);
    require(IERC20(asset).transfer(to, amount));
    return amount;
  }

  function mockInterestEarned(address to, uint256 bp) external {
    uint256 balance = aaveDai.balanceOf(to);
    aaveDai.mint(to, (balance * bp) / 10000);
  }
}
