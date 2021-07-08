<p align="center">
  <h3 align="center">Contracts</h3>
  <p align="center">
    A collection of smart contracts for the Stackup platform.
    <br />
    <a href="https://stackup.substack.com/"><strong>Dev Blog</strong></a>
    <br />
    <br />
    <a href="https://github.com/stackupfinance/contracts/actions/workflows/ci.js.yml">
      <img src="https://github.com/stackupfinance/contracts/actions/workflows/ci.js.yml/badge.svg" />
    </a>
    <a href="https://codecov.io/gh/stackupfinance/contracts">
      <img src="https://codecov.io/gh/stackupfinance/contracts/branch/master/graph/badge.svg?token=18U831QJS8" />
    </a>
  </p>
</p>

# Deployed Contracts

| Contract                                          | Address                                                                                                                  | ABI                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [SaversVault](./contracts/savers/SaversVault.sol) | [0x8834024eEf4A512b8159321b21B6deB7E6E1Ec4A](https://polygonscan.com/address/0x8834024eEf4A512b8159321b21B6deB7E6E1Ec4A) | [SaversVaultABI.json](https://gist.github.com/hazim-j/454adfe514967260c4fd1b40682f14f8#file-saversvaultabi-json) |
| [SaversDAI](./contracts/savers/SaversDAI.sol)     | [0x1786fbbC5757e728C585Af719a27a459844D0334](https://polygonscan.com/address/0x1786fbbC5757e728C585Af719a27a459844D0334) | [SaversDAIABI.json](https://gist.github.com/hazim-j/454adfe514967260c4fd1b40682f14f8#file-saversdaiabi-json)     |

## Savers Vault V1

Savers V1 is a smart contract for getting the optimal low-risk APY for stablecoins. Read more about it [here](https://stackup.substack.com/p/stackup-savers-v1).

### Deposit

```solidity
function deposit(uint256 amount) external
```

This function allows an account to deposit a given `amount` of DAI into Savers and receive interest accruing sDAI in return.

Before calling this function, make sure the `SaversVault` contract is a approved as a spender for the correct amount on the DAI ERC20 token.

### Withdraw

```solidity
function withdraw(uint256 amount) public
```

This function allows an account to burn a given `amount` of their sDAI and receive DAI from the vault in return.

### Withdraw Max

```solidity
function withdrawMax() external
```

This is a helper function to allow an account to withdraw the full amount available. It is equivalent to calling `withdraw(saversDai.balanceOf(msg.sender));`

## Savers DAI

Savers DAI is an ERC20 token and represents an account's share of the vault. It can be transferred to another account or redeemed at the vault for an equivalent amount of DAI.
