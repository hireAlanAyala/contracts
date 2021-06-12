const { ethers, waffle } = require("hardhat");
const { expect } = require("chai");
const { getRandomAmount } = require("../../utils/testHelpers");
const ILendingPoolAddressesProvider = require("../../artifacts/contracts/external/aave/ILendingPoolAddressesProvider.sol/ILendingPoolAddressesProvider.json");
const ILendingPool = require("../../artifacts/contracts/external/aave/ILendingPool.sol/ILendingPool.json");

const INITIAL_DAI = Number.MAX_SAFE_INTEGER - 1;

let MockedDAI;
let SaversDAI;
let SaversVaultContract;
let aaveLendingPoolAddressesProvider;
let aaveLendingPool;
let DAI;
let sDAI;
let SaversVault;
let owner;

describe("SaversVault", function () {
  beforeEach(async function () {
    [MockedDAI, SaversDAI, SaversVaultContract, [owner]] = await Promise.all([
      ethers.getContractFactory("MockedDAI"),
      ethers.getContractFactory("SaversDAI"),
      ethers.getContractFactory("SaversVault"),
      ethers.getSigners(),
    ]);

    [aaveLendingPoolAddressesProvider, aaveLendingPool, DAI, sDAI] =
      await Promise.all([
        waffle.deployMockContract(owner, ILendingPoolAddressesProvider.abi),
        waffle.deployMockContract(owner, ILendingPool.abi),
        MockedDAI.deploy(INITIAL_DAI),
        SaversDAI.deploy(),
      ]);
    SaversVault = await SaversVaultContract.deploy(
      DAI.address,
      sDAI.address,
      aaveLendingPoolAddressesProvider.address
    );

    const MINTER_ROLE = await sDAI.MINTER_ROLE();
    await Promise.all([
      sDAI.grantRole(MINTER_ROLE, SaversVault.address),
      sDAI.approve(SaversVault.address, ethers.constants.MaxUint256),
      DAI.approve(SaversVault.address, ethers.constants.MaxUint256),
      aaveLendingPoolAddressesProvider.mock.getLendingPool.returns(
        aaveLendingPool.address
      ),
    ]);
  });

  describe("depositing", function () {
    it("Should mint an equal amount of sDAI if the DAI deposit is successful", async function () {
      const amount = getRandomAmount();
      await SaversVault.deposit(amount);

      expect(await sDAI.balanceOf(owner.address)).to.equal(amount);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI - amount);

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(amount);
    });

    it("Should mint no sDAI if the DAI deposit fails", async function () {
      await expect(
        SaversVault.deposit(ethers.constants.MaxUint256)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await sDAI.balanceOf(owner.address)).to.equal(0);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI);

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(0);
    });
  });

  describe("withdrawing", function () {
    it("Should burn an equal amount of sDAI if the DAI withdraw is successful", async function () {
      const amount = getRandomAmount();
      await SaversVault.deposit(amount);
      await SaversVault.withdraw(amount);

      expect(await sDAI.balanceOf(owner.address)).to.equal(0);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI);

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(0);
    });

    it("Should burn no sDAI if the DAI withdraw fails", async function () {
      const amount = getRandomAmount();
      await SaversVault.deposit(amount);

      await expect(
        SaversVault.withdraw(ethers.constants.MaxUint256)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");

      expect(await sDAI.balanceOf(owner.address)).to.equal(amount);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI - amount);

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(amount);
    });
  });
});
