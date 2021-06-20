// Interface copied from https://docs.aave.com/developers/guides/liquidity-mining

// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

interface IAaveLiquidityMining {
  /**
   * @dev Claims reward for an user, on all the assets of the lending pool, accumulating the pending rewards
   * @param amount Amount of rewards to claim
   * @param to Address that will be receiving the rewards
   * @return Rewards claimed
   **/
  function claimRewards(
    address[] calldata assets,
    uint256 amount,
    address to
  ) external returns (uint256);
}
