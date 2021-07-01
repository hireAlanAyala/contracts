const saversVaultDeployArgs = (network) => {
  const deployConfig = {
    matic: {
      DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      ADAI: "0x27F8D03b3a2196956ED754baDc28D73be8830A6e",
      AAVE_LENDING_POOL_ADDRESSES_PROVIDER:
        "0xd05e3E715d945B59290df0ae8eF85c1BdB684744",
      AAVE_LIQUIDITY_MINING: "0x357D51124f59836DeD84c8a1730D72B749d8BC23",
      FARM_TOKEN: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      UNISWAP_V2_ROUTER: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
    },
  };

  return deployConfig[network];
};

module.exports = { saversVaultDeployArgs };
