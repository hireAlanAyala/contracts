// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DAI is ERC20 {
  constructor(uint256 amount) ERC20("DAI", "DAI") {
    _mint(msg.sender, amount);
  }
}
