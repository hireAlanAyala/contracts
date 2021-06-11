require("@nomiclabs/hardhat-waffle");
require("hardhat-watcher");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  watcher: {
    test: {
      tasks: ["test"],
      files: ["./contracts", "./test", "./utils/testHelpers.js"],
    },
  },
};
