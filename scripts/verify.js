async function main() {
  // // Vault
  // await hre.run("verify:verify", {
  //   address: "0xe84D177aC9F1815D34423Cb71b10490182E97252",
  //   constructorArguments: [],
  // });
  // // USDG
  // await hre.run("verify:verify", {
  //   address: "0x6d3a50eE3001981D27f9272C0B70B71a47Ef8AA0",
  //   constructorArguments: ["0xe84D177aC9F1815D34423Cb71b10490182E97252"],
  // });
  // // Router
  // await hre.run("verify:verify", {
  //   address: "0xa6c89Df2EC1901852A279d218447037594261fB6",
  //   constructorArguments: [
  //     "0xe84D177aC9F1815D34423Cb71b10490182E97252",
  //     "0x6d3a50eE3001981D27f9272C0B70B71a47Ef8AA0",
  //     "0x4200000000000000000000000000000000000006",
  //   ],
  // });
  // // VaultPriceFeed
  // await hre.run("verify:verify", {
  //   address: "0x25e84a50770Ae3E3369D448B66a4DB55a178357F",
  //   constructorArguments: [],
  // });
  // // VaultErrorController
  // await hre.run("verify:verify", {
  //   address: "0x8E557f16D2AEdfbC2239Ab0Ec8c632A5b2EE95a9",
  //   constructorArguments: [],
  // });
  // // VaultUtils
  // await hre.run("verify:verify", {
  //   address: "0xaA9c4F319Cf01D713a61435D1B3E3Bad7CCeF012",
  //   constructorArguments: ["0xe84D177aC9F1815D34423Cb71b10490182E97252"],
  // });
  // // OrderBook
  // await hre.run("verify:verify", {
  //   address: "0x95821c7943dbfc1f6a44E19A7c31530CFd8A250D",
  //   constructorArguments: [],
  // });
  // PositionUtils
  await hre.run("verify:verify", {
    address: "0xc5CE2Ac2B3baD616A28Bf3A6261778E0A614Ab85",
    constructorArguments: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
