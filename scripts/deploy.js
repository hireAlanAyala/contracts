const { ethers } = require("hardhat");
const { saversVaultDeployArgs } = require("../utils/deployHelpers");

async function main() {
  const {
    DAI,
    ADAI,
    AAVE_LENDING_POOL_ADDRESSES_PROVIDER,
    AAVE_LIQUIDITY_MINING,
    FARM_TOKEN,
    UNISWAP_V2_ROUTER,
  } = saversVaultDeployArgs(process.env.HARDHAT_NETWORK);
  const saversVault = await ethers
    .getContractFactory("SaversVault")
    .then((c) =>
      c.deploy(
        DAI,
        ADAI,
        AAVE_LENDING_POOL_ADDRESSES_PROVIDER,
        AAVE_LIQUIDITY_MINING,
        FARM_TOKEN,
        UNISWAP_V2_ROUTER
      )
    );

  console.log("SaversVault deployed to:", saversVault.address);
  console.log("SaversDAI deployed to:", await saversVault.saversDai());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
