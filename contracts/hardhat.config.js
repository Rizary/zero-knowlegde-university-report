const { task } = require("hardhat/config");
const { poseidonContract } = require("circomlibjs");
require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

task('hasher', 'Compile Poseidon hasher', () => {
    require('./scripts/compileHasher')
})

task('poseidon', 'Deploy Poseidon Contract')
    .setAction(async () => {
        const [deployer] = await ethers.getSigners();
        const PoseidonHasher = new hre.ethers.ContractFactory(
            poseidonContract.generateABI(2),
            poseidonContract.createCode(2),
            deployer
        );
        const poseidonHasher = await PoseidonHasher.deploy();
        await poseidonHasher.deployed();
        console.log("PoseidonHasher Contract deployed to:", poseidonHasher.address); 
    });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    harmonyTestnet: {
      url: process.env.HARMONY_TEST_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    harmonyMainnet: {
        url: process.env.HARMONY_MAIN_URL || "",
        accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};
