// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../external/aave/ILendingPoolAddressesProvider.sol";
import "../external/aave/ILendingPool.sol";
import "./SaversDAI.sol";

contract SaversVault {
  using SafeMath for uint256;

  address public dai;
  address public aaveDai;
  address public aaveLendingPoolAddressesProvider;
  SaversDAI public saversDai;
  uint256 totalDaiDeposits;
  mapping(address => uint256) public accountDaiDeposits;

  constructor(
    address _dai,
    address _aaveDai,
    address _aaveLendingPoolAddressesProvider
  ) {
    dai = _dai;
    aaveDai = _aaveDai;
    aaveLendingPoolAddressesProvider = _aaveLendingPoolAddressesProvider;
    saversDai = new SaversDAI(address(this));
    totalDaiDeposits = 0;
  }

  function getAaveLendingPoolAddress() private view returns (address) {
    return
      ILendingPoolAddressesProvider(aaveLendingPoolAddressesProvider)
        .getLendingPool();
  }

  /**
   * @dev Deposit DAI and mint sDAI.
   */
  function deposit(uint256 amount) external {
    // transfer DAI from user to vault
    require(IERC20(dai).transferFrom(msg.sender, address(this), amount));

    // deposit DAI into Aave lending pool and receive same amount of aDAI
    // aDAI is managed by the vault
    address AaveLendingPool = getAaveLendingPoolAddress();
    require(IERC20(dai).approve(AaveLendingPool, amount));
    ILendingPool(AaveLendingPool).deposit(dai, amount, address(this), 0);

    // mint same amount of sDAI and send to user
    saversDai.mint(msg.sender, amount);

    // update mappings
    totalDaiDeposits += amount;
    accountDaiDeposits[msg.sender] += amount;
  }

  /**
   * @dev Redeem sDAI for deposited DAI + interest earned.
   */
  function withdraw(uint256 amount) external {
    // burn sDAI on user
    saversDai.burn(msg.sender, amount);

    // get deposit amount before payout
    uint256 depositAmount = amount - interestEarnedForAccount(msg.sender);

    // burn aDAI in vault and send DAI to user
    ILendingPool(getAaveLendingPoolAddress()).withdraw(dai, amount, msg.sender);

    // update mappings
    totalDaiDeposits -= depositAmount;
    accountDaiDeposits[msg.sender] -= depositAmount;
  }

  /**
   * @dev Returns total interest earned by the vault.
   * totalInterest = balanceOfInterestBearingToken - totalAssetDeposit.
   */
  function totalInterestEarned() public view returns (uint256) {
    return IERC20(aaveDai).balanceOf(address(this)) - totalDaiDeposits;
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
    if (totalDaiDeposits == 0) {
      return 0;
    }
    uint256 shareOfDaiReserves =
      (accountDaiDeposits[account] * (10**18)) / totalDaiDeposits;

    return (totalInterestEarned() * shareOfDaiReserves) / (10**18);
  }
}
