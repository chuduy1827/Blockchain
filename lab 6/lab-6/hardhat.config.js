require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    trustkeys: {
      url: "https://l1testnet.trustkeys.network",
      // Fallback URL from slide: https://l1testnet.trustkeys.network
      // If custom Remix URL is used: https://remix.trustkeys.com uses same RPC
      chainId: 11968,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
