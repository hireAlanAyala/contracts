// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "./AaveDAI.sol";

contract AaveLendingPool {
  address aDAI;

  constructor(address _aDAI) {
    aDAI = _aDAI;
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
    AaveDAI(aDAI).mint(onBehalfOf, amount);
  }

  function withdraw(
    address asset,
    uint256 amount,
    address to
  ) external returns (uint256) {
    AaveDAI(aDAI).burn(msg.sender, amount);
    require(IERC20(asset).transfer(to, amount));
    return amount;
  }
}
