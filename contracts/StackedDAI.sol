// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StackedDAI is ERC20, Ownable {
  constructor() ERC20("StackedDAI", "sDAI") {}

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}
