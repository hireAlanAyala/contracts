// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SaversVault.sol";

contract SaversDAI is ERC20, Ownable {
  address saversVault;

  constructor(address _saversVault) ERC20("SaversDAI", "sDAI") {
    saversVault = _saversVault;
  }

  function getPrincipalBalance(address account, uint256 amount)
    private
    view
    returns (uint256)
  {
    return amount - SaversVault(saversVault).interestEarnedForAccount(account);
  }

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }

  function burn(address account, uint256 amount) public onlyOwner {
    _burn(account, amount);
  }

  function balanceOf(address account) public view override returns (uint256) {
    return
      ERC20.balanceOf(account) +
      SaversVault(saversVault).interestEarnedForAccount(account);
  }

  function transfer(address recipient, uint256 amount)
    public
    override
    returns (bool)
  {
    require(ERC20.transfer(recipient, getPrincipalBalance(msg.sender, amount)));
    return true;
  }

  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) public override returns (bool) {
    require(
      ERC20.transferFrom(sender, recipient, getPrincipalBalance(sender, amount))
    );
    return true;
  }

  function totalSupply() public view override returns (uint256) {
    return ERC20.totalSupply() + SaversVault(saversVault).totalInterestEarned();
  }
}
