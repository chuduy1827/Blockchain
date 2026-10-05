require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { PRIVATE_KEY, TRUSTKEYS_RPC_URL } = process.env;

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    trustkeys: {
      url: TRUSTKEYS_RPC_URL || "https://l1testnet.trustkeys.network",
      chainId: 11968,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
