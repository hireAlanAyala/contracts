// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IUniswapV2Router02} from "../external/uniswap/IUniswapV2Router02.sol";
import "../external/aave/IAaveLiquidityMining.sol";
import "../external/aave/ILendingPoolAddressesProvider.sol";
import "../external/aave/ILendingPool.sol";
import "./SaversDAI.sol";

contract SaversVault {
  using SafeMath for uint256;

  address public dai;
  address public aaveDai;
  address public aaveLendingPoolAddressesProvider;
  address public aaveLiquidityMining;
  address public farmToken;
  address public uniswapV2Router;
  SaversDAI public saversDai;

  constructor(
    address _dai,
    address _aaveDai,
    address _aaveLendingPoolAddressesProvider,
    address _aaveLiquidityMining,
    address _farmToken,
    address _uniswapV2Router
  ) {
    dai = _dai;
    aaveDai = _aaveDai;
    aaveLendingPoolAddressesProvider = _aaveLendingPoolAddressesProvider;
    aaveLiquidityMining = _aaveLiquidityMining;
    farmToken = _farmToken;
    uniswapV2Router = _uniswapV2Router;
    saversDai = new SaversDAI(address(this));
  }

  function _getAaveLendingPoolAddress() private view returns (address) {
    return
      ILendingPoolAddressesProvider(aaveLendingPoolAddressesProvider)
        .getLendingPool();
  }

  function _supply(uint256 amount) private {
    address AaveLendingPool = _getAaveLendingPoolAddress();
    require(IERC20(dai).approve(AaveLendingPool, amount));
    ILendingPool(AaveLendingPool).deposit(dai, amount, address(this), 0);
  }

  /**
   * @dev Deposit DAI and mint sDAI.
   */
  function deposit(uint256 amount) external {
    // transfer DAI from user to vault
    require(IERC20(dai).transferFrom(msg.sender, address(this), amount));

    // deposit DAI into Aave lending pool and receive same amount of aDAI
    // aDAI is managed by the vault
    _supply(amount);

    // mint same amount of sDAI and send to user
    saversDai.mint(msg.sender, amount);
  }

  /**
   * @dev Redeem sDAI for deposited DAI + interest earned.
   */
  function withdraw(uint256 amount) public {
    // burn sDAI on user
    saversDai.burn(msg.sender, saversDai.getPrincialOnly(msg.sender, amount));

    // burn aDAI in vault and send DAI to user
    ILendingPool(_getAaveLendingPoolAddress()).withdraw(
      dai,
      amount,
      msg.sender
    );
  }

  /**
   * @dev Redeem max amount of sDAI on sender account.
   */
  function withdrawMax() external {
    uint256 balance = saversDai.balanceOf(msg.sender);
    withdraw(balance);
  }

  /**
   * @dev Claims liquidity mining incentives and reinvests it.
   */
  function reinvestIncentives(
    uint256 amount,
    address[] calldata incentivisedAssets,
    address[] calldata swapPath
  ) external {
    // Claim the farm tokens
    IAaveLiquidityMining(aaveLiquidityMining).claimRewards(
      incentivisedAssets,
      amount,
      address(this)
    );
    uint256 claimedAmount = IERC20(farmToken).balanceOf(address(this));
    require(claimedAmount > 0, "No farm tokens to reinvest");

    // Get qoute for swapping farm token to DAI
    uint256[] memory amounts =
      IUniswapV2Router02(uniswapV2Router).getAmountsOut(
        claimedAmount,
        swapPath
      );
    uint256 amountOut = amounts[amounts.length.sub(1)];
    uint256 amountOutMin = (amountOut * 9950) / 10000; // 0.5% slippage

    // Swap farm token for DAI
    require(IERC20(farmToken).approve(uniswapV2Router, claimedAmount));
    IUniswapV2Router02(uniswapV2Router).swapExactTokensForTokens(
      claimedAmount,
      amountOutMin,
      swapPath,
      address(this),
      block.timestamp
    );

    // Reinvest DAI into Aave lending pool
    _supply(amount);
  }

  /**
   * @dev Returns total interest earned by the vault.
   * totalInterest = balanceOfInterestBearingToken - totalAssetDeposit.
   */
  function totalInterestEarned() public view returns (uint256) {
    return
      IERC20(aaveDai).balanceOf(address(this)) -
      saversDai.totalPrincipalSupply();
  }

  /**
   * @dev Returns the account's share of the interest earned by the vault.
   * accountInterestEarned = TotalInterestEarned * shareOfAssetReserve.
   */
  function interestEarnedForAccount(address account)
    public
    view
    returns (uint256)
  {
    uint256 totalDaiDeposits = saversDai.totalPrincipalSupply();
    if (totalDaiDeposits == 0) {
      return 0;
    }

    uint256 shareOfDaiReserves =
      (saversDai.balanceOfPrincipal(account) * (10**18)) / totalDaiDeposits;
    return (totalInterestEarned() * shareOfDaiReserves) / (10**18);
  }
}
