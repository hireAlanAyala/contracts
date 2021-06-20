// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "../external/aave/IAaveLiquidityMining.sol";
import "./FarmToken.sol";

/**
 * @dev A mock of the Aave liquidity mining guide for testing purposes.
 *
 * All functions (without a "mock" prefix) follow the interface of the real
 * liquidity mining guide defined at:
 * https://docs.aave.com/developers/guides/liquidity-mining.
 */
contract AaveLiquidityMining is IAaveLiquidityMining {
  FarmToken public farmToken;

  constructor() {
    farmToken = new FarmToken();
  }

  function claimRewards(
    address[] calldata assets,
    uint256 amount,
    address to
  ) external override returns (uint256) {
    // suppress warnings
    assets;

    farmToken.mint(to, amount);
    return amount;
  }
}
