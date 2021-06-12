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
  address public saversDai;
  address public aaveLendingPoolAddressesProvider;

  constructor(
    address _dai,
    address _saversDai,
    address _aaveLendingPoolAddressesProvider
  ) {
    dai = _dai;
    saversDai = _saversDai;
    aaveLendingPoolAddressesProvider = _aaveLendingPoolAddressesProvider;
  }

  function getLendingPool() private view returns (ILendingPool) {
    return
      ILendingPool(
        ILendingPoolAddressesProvider(aaveLendingPoolAddressesProvider)
          .getLendingPool()
      );
  }

  function deposit(uint256 amount) external {
    require(IERC20(dai).transferFrom(msg.sender, address(this), amount));
    SaversDAI(saversDai).mint(msg.sender, amount);
  }

  function withdraw(uint256 amount) external {
    ERC20Burnable(saversDai).burnFrom(msg.sender, amount);
    require(IERC20(dai).transfer(msg.sender, amount));
  }
}
