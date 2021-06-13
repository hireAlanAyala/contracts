const { ethers, waffle } = require("hardhat");
const { expect } = require("chai");
const { getRandomAmount } = require("../../utils/testHelpers");
const ILendingPoolAddressesProvider = require("../../artifacts/contracts/external/aave/ILendingPoolAddressesProvider.sol/ILendingPoolAddressesProvider.json");
const AaveDAI = require("../../artifacts/contracts/mocks/AaveDAI.sol/AaveDAI.json");
const SaversDAI = require("../../artifacts/contracts/savers/SaversDAI.sol/SaversDAI.json");

const INITIAL_DAI = Number.MAX_SAFE_INTEGER - 1;

let aaveLendingPoolAddressesProvider;
let aaveLendingPool;
let DAI;
let aDAI;
let sDAI;
let SaversVault;
let owner;

describe("SaversVault", function () {
  beforeEach(async function () {
    [DAI, aaveLendingPool, [owner]] = await Promise.all([
      ethers.getContractFactory("DAI").then((c) => c.deploy(INITIAL_DAI)),
      ethers.getContractFactory("AaveLendingPool").then((c) => c.deploy()),
      ethers.getSigners(),
    ]);

    aaveLendingPoolAddressesProvider = await waffle.deployMockContract(
      owner,
      ILendingPoolAddressesProvider.abi
    );

    SaversVault = await ethers
      .getContractFactory("SaversVault")
      .then((c) =>
        c.deploy(DAI.address, aaveLendingPoolAddressesProvider.address)
      );

    aDAI = new ethers.Contract(
      await aaveLendingPool.aaveDai(),
      AaveDAI.abi,
      owner
    );
    sDAI = new ethers.Contract(
      await SaversVault.saversDai(),
      SaversDAI.abi,
      owner
    );

    await Promise.all([
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
      expect(await aDAI.balanceOf(owner.address)).to.equal(0);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI - amount);

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(amount);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(0);
    });

    it("Should mint no sDAI if the DAI deposit fails", async function () {
      await expect(
        SaversVault.deposit(ethers.constants.MaxUint256)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await sDAI.balanceOf(owner.address)).to.equal(0);
      expect(await aDAI.balanceOf(owner.address)).to.equal(0);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI);

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(0);
    });
  });

  describe("withdrawing", function () {
    it("Should burn an equal amount of sDAI if the DAI withdraw is successful", async function () {
      const amount = getRandomAmount();
      await SaversVault.deposit(amount);
      await SaversVault.withdraw(amount);

      expect(await sDAI.balanceOf(owner.address)).to.equal(0);
      expect(await aDAI.balanceOf(owner.address)).to.equal(0);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI);

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(0);
    });

    it("Should burn no sDAI if the DAI withdraw fails", async function () {
      const amount = getRandomAmount();
      await SaversVault.deposit(amount);

      await expect(
        SaversVault.withdraw(ethers.constants.MaxUint256)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");

      expect(await sDAI.balanceOf(owner.address)).to.equal(amount);
      expect(await aDAI.balanceOf(owner.address)).to.equal(0);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI - amount);

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(amount);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(0);
    });
  });
});
