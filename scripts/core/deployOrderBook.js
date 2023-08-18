const {
  deployContract,
  contractAt,
  sendTxn,
  writeTmpAddresses,
} = require("../shared/helpers");
const { expandDecimals } = require("../../test/shared/utilities");

const network = process.env.HARDHAT_NETWORK || "testnet";
const tokens = require("./tokens")[network];

async function main() {
  const { nativeToken } = tokens;

  const orderBook = await deployContract("OrderBook", []);

  // Arbitrum mainnet addresses
  await sendTxn(
    orderBook.initialize(
      "0xa6c89Df2EC1901852A279d218447037594261fB6", // router
      "0xe84D177aC9F1815D34423Cb71b10490182E97252", // vault
      nativeToken.address, // weth
      "0x6d3a50eE3001981D27f9272C0B70B71a47Ef8AA0", // usdg
      "10000000000000000", // 0.01 AVAX
      expandDecimals(10, 30) // min purchase token amount usd
    ),
    "orderBook.initialize"
  );

  writeTmpAddresses({
    orderBook: orderBook.address,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
