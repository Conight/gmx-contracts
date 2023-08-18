const { deployContract, sendTxn } = require("../shared/helpers");

async function main() {
  const tokenManager = await deployContract(
    "TokenManager",
    [4],
    "TokenManager"
  );

  const signers = [
    "0x7C14D748d1eAD29127318BbB643C240050878Fe7", // Gov
  ];

  await sendTxn(tokenManager.initialize(signers), "tokenManager.initialize");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
