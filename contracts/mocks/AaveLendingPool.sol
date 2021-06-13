// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "./AaveDAI.sol";

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
}
