require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("@typechain/hardhat");

const {
  OPTIMISM_URL,
  OPTIMISM_DEPLOY_KEY,
  OPTIMISM_API_KEY,
  OPTIMISM_GOERLI_URL,
  OPTIMISM_GOERLI_DEPLOY_KEY,
} = require("./env.json");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.info(account.address);
  }
});

task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs) => {
    const balance = await ethers.provider.getBalance(taskArgs.account);

    console.log(ethers.utils.formatEther(balance), "ETH");
  });

task("processFees", "Processes fees")
  .addParam("steps", "The steps to run")
  .setAction(async (taskArgs) => {
    const { processFees } = require("./scripts/core/processFees");
    await processFees(taskArgs);
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    localhost: {
      timeout: 120000,
    },
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    op: {
      url: OPTIMISM_URL,
      chainId: 10,
      gasPrice: 1000000,
      accounts: [OPTIMISM_DEPLOY_KEY],
    },
    testnet: {
      url: OPTIMISM_GOERLI_URL,
      chainId: 420,
      gasPrice: 100,
      accounts: [OPTIMISM_GOERLI_DEPLOY_KEY],
    },
  },
  etherscan: {
    apiKey: {
      op: OPTIMISM_API_KEY,
    },
  },
  solidity: {
    version: "0.6.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10,
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};
