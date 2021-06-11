const { ethers } = require("hardhat");
const { expect } = require("chai");
const { getRandomAmount } = require("../../../utils/testHelpers");

const INITIAL_DAI = Number.MAX_SAFE_INTEGER - 1;

let MockedDAI;
let SaversDAI;
let SaversDAIVaultContract;
let DAI;
let sDAI;
let SaversDAIVault;
let owner;

describe("SaversDAIVault", function () {
  beforeEach(async function () {
    [MockedDAI, SaversDAI, SaversDAIVaultContract, [owner]] = await Promise.all(
      [
        ethers.getContractFactory("MockedDAI"),
        ethers.getContractFactory("SaversDAI"),
        ethers.getContractFactory("SaversDAIVault"),
        ethers.getSigners(),
      ]
    );

    [DAI, sDAI] = await Promise.all([
      MockedDAI.deploy(INITIAL_DAI),
      SaversDAI.deploy(),
    ]);
    SaversDAIVault = await SaversDAIVaultContract.deploy(
      DAI.address,
      sDAI.address
    );

    const MINTER_ROLE = await sDAI.MINTER_ROLE();
    await Promise.all([
      sDAI.grantRole(MINTER_ROLE, SaversDAIVault.address),
      sDAI.approve(SaversDAIVault.address, ethers.constants.MaxUint256),
      DAI.approve(SaversDAIVault.address, ethers.constants.MaxUint256),
    ]);
  });

  describe("depositing", function () {
    it("Should mint an equal amount of sDAI if the DAI deposit is successful", async function () {
      const amount = getRandomAmount();
      await SaversDAIVault.deposit(amount);

      expect(await sDAI.balanceOf(owner.address)).to.equal(amount);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI - amount);

      expect(await sDAI.balanceOf(SaversDAIVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversDAIVault.address)).to.equal(amount);
    });

    it("Should mint no sDAI if the DAI deposit fails", async function () {
      await expect(
        SaversDAIVault.deposit(ethers.constants.MaxUint256)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await sDAI.balanceOf(owner.address)).to.equal(0);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI);

      expect(await sDAI.balanceOf(SaversDAIVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversDAIVault.address)).to.equal(0);
    });
  });

  describe("withdrawing", function () {
    it("Should burn an equal amount of sDAI if the DAI withdraw is successful", async function () {
      const amount = getRandomAmount();
      await SaversDAIVault.deposit(amount);
      await SaversDAIVault.withdraw(amount);

      expect(await sDAI.balanceOf(owner.address)).to.equal(0);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI);

      expect(await sDAI.balanceOf(SaversDAIVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversDAIVault.address)).to.equal(0);
    });

    it("Should burn no sDAI if the DAI withdraw fails", async function () {
      const amount = getRandomAmount();
      await SaversDAIVault.deposit(amount);

      await expect(
        SaversDAIVault.withdraw(ethers.constants.MaxUint256)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");

      expect(await sDAI.balanceOf(owner.address)).to.equal(amount);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI - amount);

      expect(await sDAI.balanceOf(SaversDAIVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversDAIVault.address)).to.equal(amount);
    });
  });
});
