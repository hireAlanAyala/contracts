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
  address public aaveLendingPoolAddressesProvider;
  SaversDAI public saversDai;

  constructor(address _dai, address _aaveLendingPoolAddressesProvider) {
    dai = _dai;
    aaveLendingPoolAddressesProvider = _aaveLendingPoolAddressesProvider;
    saversDai = new SaversDAI();
  }

  function getAaveLendingPoolAddress() private view returns (address) {
    return
      ILendingPoolAddressesProvider(aaveLendingPoolAddressesProvider)
        .getLendingPool();
  }

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
  }

  function withdraw(uint256 amount) external {
    // burn sDAI on user
    saversDai.burn(msg.sender, amount);

    // burn aDAI in vault and send DAI to user
    ILendingPool(getAaveLendingPoolAddress()).withdraw(dai, amount, msg.sender);
  }
}
