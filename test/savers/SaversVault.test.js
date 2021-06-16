const { ethers, waffle } = require("hardhat");
const { expect } = require("chai");
const {
  getRandomAmount,
  getRandomBasisPoints,
} = require("../../utils/testHelpers");
const ILendingPoolAddressesProvider = require("../../artifacts/contracts/external/aave/ILendingPoolAddressesProvider.sol/ILendingPoolAddressesProvider.json");
const AaveDAI = require("../../artifacts/contracts/mocks/AaveDAI.sol/AaveDAI.json");
const SaversDAI = require("../../artifacts/contracts/savers/SaversDAI.sol/SaversDAI.json");

const INITIAL_DAI = ethers.constants.MaxUint256;
const WEI_MARGIN_OF_ERROR = 10;
const calculateInterest = (amount, bp) =>
  ethers.BigNumber.from(amount).mul(bp).div(10000);

let aaveLendingPoolAddressesProvider;
let aaveLendingPool;
let DAI;
let aDAI;
let sDAI;
let SaversVault;
let owner;
let addr1;
let addr2;
let triggerInterest;

describe("SaversVault", function () {
  beforeEach(async function () {
    [DAI, aaveLendingPool, [owner, addr1, addr2]] = await Promise.all([
      ethers.getContractFactory("DAI").then((c) => c.deploy(INITIAL_DAI)),
      ethers.getContractFactory("AaveLendingPool").then((c) => c.deploy()),
      ethers.getSigners(),
    ]);

    aaveLendingPoolAddressesProvider = await waffle.deployMockContract(
      owner,
      ILendingPoolAddressesProvider.abi
    );
    aDAI = new ethers.Contract(
      await aaveLendingPool.aaveDai(),
      AaveDAI.abi,
      owner
    );

    SaversVault = await ethers
      .getContractFactory("SaversVault")
      .then((c) =>
        c.deploy(
          DAI.address,
          aDAI.address,
          aaveLendingPoolAddressesProvider.address
        )
      );
    sDAI = new ethers.Contract(
      await SaversVault.saversDai(),
      SaversDAI.abi,
      owner
    );

    await Promise.all([
      DAI.approve(SaversVault.address, ethers.constants.MaxUint256),
      DAI.connect(addr1).approve(
        SaversVault.address,
        ethers.constants.MaxUint256
      ),
      aaveLendingPoolAddressesProvider.mock.getLendingPool.returns(
        aaveLendingPool.address
      ),
    ]);

    triggerInterest = async () => {
      const bp = getRandomBasisPoints();
      const balance = await aDAI.balanceOf(SaversVault.address);
      const interestEarned = ethers.BigNumber.from(
        ethers.BigNumber.from(balance).mul(bp)
      ).div(10000);

      await DAI.transfer(aaveLendingPool.address, interestEarned);
      await aaveLendingPool.mockInterestEarned(SaversVault.address, bp);

      return interestEarned;
    };
  });

  describe("depositing", function () {
    it("Should mint an equal amount of sDAI if the DAI deposit is successful", async function () {
      const amount = getRandomAmount();
      await SaversVault.deposit(amount);

      expect(await sDAI.balanceOf(owner.address)).to.equal(amount);
      expect(await aDAI.balanceOf(owner.address)).to.equal(0);
      expect(await DAI.balanceOf(owner.address)).to.equal(
        INITIAL_DAI.sub(amount)
      );

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(amount);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(0);
    });

    it("Should mint no sDAI if the DAI deposit fails", async function () {
      const amount = getRandomAmount();
      await DAI.transfer(addr1.address, amount);
      await expect(
        SaversVault.deposit(ethers.constants.MaxUint256)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await sDAI.balanceOf(owner.address)).to.equal(0);
      expect(await aDAI.balanceOf(owner.address)).to.equal(0);
      expect(await DAI.balanceOf(owner.address)).to.equal(
        INITIAL_DAI.sub(amount)
      );

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(0);
    });

    it("Should be successful after interest earned", async function () {
      await triggerInterest();
      const firstDeposit = getRandomAmount();
      await DAI.transfer(addr1.address, firstDeposit);
      await SaversVault.connect(addr1).deposit(firstDeposit);

      expect(await sDAI.balanceOf(addr1.address)).to.equal(firstDeposit);
      expect(await aDAI.balanceOf(addr1.address)).to.equal(0);
      expect(await DAI.balanceOf(addr1.address)).to.equal(0);

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(firstDeposit);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(0);

      const interestEarned = await triggerInterest();
      const secondDeposit = getRandomAmount();
      await DAI.transfer(addr1.address, secondDeposit);
      await SaversVault.connect(addr1).deposit(secondDeposit);

      expect(await sDAI.balanceOf(addr1.address)).to.equal(
        ethers.BigNumber.from(firstDeposit)
          .add(secondDeposit)
          .add(interestEarned)
      );
      expect(await aDAI.balanceOf(addr1.address)).to.equal(0);
      expect(await DAI.balanceOf(addr1.address)).to.equal(0);

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(
        ethers.BigNumber.from(firstDeposit)
          .add(secondDeposit)
          .add(interestEarned)
      );
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
      expect(await DAI.balanceOf(owner.address)).to.equal(
        INITIAL_DAI.sub(amount)
      );

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(amount);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(0);
    });

    it("Should be successful after interest earned", async function () {
      const amount = getRandomAmount();
      await SaversVault.deposit(amount);

      await triggerInterest();
      await SaversVault.withdraw(await sDAI.balanceOf(owner.address));

      expect(await sDAI.balanceOf(owner.address)).to.equal(0);
      expect(await aDAI.balanceOf(owner.address)).to.equal(0);
      expect(await DAI.balanceOf(owner.address)).to.equal(INITIAL_DAI);

      expect(await sDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(0);
      expect(await DAI.balanceOf(SaversVault.address)).to.equal(0);
    });
  });

  describe("account balance", function () {
    let ownerAmount;
    let addr1Amount;
    let addr2Amount;
    let vaultAmount;
    let basisPoints;
    let ownerInterestEarned;
    let addr1InterestEarned;
    let addr2InterestEarned;
    let vaultInterestEarned;

    beforeEach(async function () {
      ownerAmount = getRandomAmount();
      addr1Amount = getRandomAmount();
      addr2Amount = getRandomAmount();
      vaultAmount = ethers.BigNumber.from(ownerAmount)
        .add(addr1Amount)
        .add(addr2Amount);

      basisPoints = getRandomBasisPoints();

      ownerInterestEarned = calculateInterest(ownerAmount, basisPoints);
      addr1InterestEarned = calculateInterest(addr1Amount, basisPoints);
      addr2InterestEarned = calculateInterest(addr2Amount, basisPoints);
      vaultInterestEarned = calculateInterest(vaultAmount, basisPoints);

      await Promise.all([
        DAI.transfer(addr1.address, addr1Amount),
        DAI.transfer(addr2.address, addr2Amount),
        DAI.connect(addr1).approve(
          SaversVault.address,
          ethers.constants.MaxUint256
        ),
        DAI.connect(addr2).approve(
          SaversVault.address,
          ethers.constants.MaxUint256
        ),
      ]);
    });

    it("Should be pegged to the users share of aDAI in the vault", async function () {
      await Promise.all([
        SaversVault.deposit(ownerAmount),
        SaversVault.connect(addr1).deposit(addr1Amount),
        SaversVault.connect(addr2).deposit(addr2Amount),
      ]);
      expect(await sDAI.balanceOf(owner.address)).to.equal(ownerAmount);
      expect(await sDAI.balanceOf(addr1.address)).to.equal(addr1Amount);
      expect(await sDAI.balanceOf(addr2.address)).to.equal(addr2Amount);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(vaultAmount);

      await aaveLendingPool.mockInterestEarned(
        SaversVault.address,
        basisPoints
      );

      expect(
        ethers.BigNumber.from(ownerAmount)
          .add(ownerInterestEarned)
          .sub(await sDAI.balanceOf(owner.address))
      ).to.be.below(WEI_MARGIN_OF_ERROR);
      expect(
        ethers.BigNumber.from(addr1Amount)
          .add(addr1InterestEarned)
          .sub(await sDAI.balanceOf(addr1.address))
      ).to.be.below(WEI_MARGIN_OF_ERROR);
      expect(
        ethers.BigNumber.from(addr2Amount)
          .add(addr2InterestEarned)
          .sub(await sDAI.balanceOf(addr2.address))
      ).to.be.below(WEI_MARGIN_OF_ERROR);
      expect(await aDAI.balanceOf(SaversVault.address)).to.equal(
        ethers.BigNumber.from(vaultAmount).add(vaultInterestEarned)
      );
    });

    it("Should all sum up to the sDAI total supply", async function () {
      await Promise.all([
        SaversVault.deposit(ownerAmount),
        SaversVault.connect(addr1).deposit(addr1Amount),
        SaversVault.connect(addr2).deposit(addr2Amount),
      ]);
      await aaveLendingPool.mockInterestEarned(
        SaversVault.address,
        basisPoints
      );

      const sumOfAccountBalances = ethers.BigNumber.from(
        await sDAI.balanceOf(owner.address)
      )
        .add(await sDAI.balanceOf(addr1.address))
        .add(await sDAI.balanceOf(addr2.address));
      expect(sumOfAccountBalances.sub(await sDAI.totalSupply())).to.be.below(
        WEI_MARGIN_OF_ERROR
      );
    });
  });
});
