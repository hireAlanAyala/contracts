const { ethers } = require("hardhat");
const { expect } = require("chai");

let StackedDAI;
let sDAI;
let owner;
let addr1;
let addr2;

const between = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

describe("StackedDAI", function () {
  beforeEach(async function () {
    StackedDAI = await ethers.getContractFactory("StackedDAI");
    [owner, addr1, addr2] = await ethers.getSigners();

    sDAI = await StackedDAI.deploy();
  });

  describe("minting", function () {
    it("Should pass if Owner tries to mint any amount", async function () {
      const amount = between(1, Number.MAX_SAFE_INTEGER);
      await sDAI.mint(owner.address, amount);

      expect(await sDAI.balanceOf(owner.address)).to.equal(amount);
    });

    it("Should pass if a Minter tries to mint any amount", async function () {
      const amount = between(1, Number.MAX_SAFE_INTEGER);
      const MINTER_ROLE = await sDAI.MINTER_ROLE();

      await sDAI.grantRole(MINTER_ROLE, addr1.address);
      await sDAI.connect(addr1).mint(addr1.address, amount);

      expect(await sDAI.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should fail if a normal account tries to mint any amount", async function () {
      const amount = between(1, Number.MAX_SAFE_INTEGER);
      const MINTER_ROLE = await sDAI.MINTER_ROLE();
      const initialAddr1Balance = await sDAI.balanceOf(addr1.address);

      await expect(
        sDAI.connect(addr1).mint(addr1.address, amount)
      ).to.be.revertedWith(
        `AccessControl: account ${addr1.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );

      expect(await sDAI.balanceOf(addr1.address)).to.equal(initialAddr1Balance);
    });
  });

  describe("transferring", function () {
    it("Should be allowed between any accounts", async function () {
      // mint initial supply
      await sDAI.mint(owner.address, 100);

      // check initial balances
      const [initialOwnerBalance, initialAddr1Balance, initialAddr2Balance] =
        await Promise.all([
          sDAI.balanceOf(owner.address),
          sDAI.balanceOf(addr1.address),
          sDAI.balanceOf(addr2.address),
        ]);
      expect(initialOwnerBalance).to.equal(100);
      expect(initialAddr1Balance).to.equal(0);
      expect(initialAddr2Balance).to.equal(0);

      // transfer and check end balances
      await sDAI.transfer(addr1.address, 50);
      await sDAI.connect(addr1).transfer(addr2.address, 25);
      const [endOwnerBalance, endAddr1Balance, endAddr2Balance] =
        await Promise.all([
          sDAI.balanceOf(owner.address),
          sDAI.balanceOf(addr1.address),
          sDAI.balanceOf(addr2.address),
        ]);
      expect(endOwnerBalance).to.equal(50);
      expect(endAddr1Balance).to.equal(25);
      expect(endAddr2Balance).to.equal(25);
    });

    it("Should be reverted if an account doesn't have the correct amount", async function () {
      // mint and check initial balances
      await sDAI.mint(owner.address, 100);
      const [initialOwnerBalance, initialAddr1Balance] = await Promise.all([
        sDAI.balanceOf(owner.address),
        sDAI.balanceOf(addr1.address),
      ]);
      expect(initialOwnerBalance).to.equal(100);
      expect(initialAddr1Balance).to.equal(0);

      // attempt transfer and check end balances
      await expect(sDAI.transfer(addr1.address, 500)).to.be.revertedWith(
        "ERC20: transfer amount exceeds balance"
      );
      const [endOwnerBalance, endAddr1Balance] = await Promise.all([
        sDAI.balanceOf(owner.address),
        sDAI.balanceOf(addr1.address),
      ]);
      expect(endOwnerBalance).to.equal(100);
      expect(endAddr1Balance).to.equal(0);
    });
  });
});
