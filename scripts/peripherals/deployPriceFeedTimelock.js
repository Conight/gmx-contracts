const {
  deployContract,
  contractAt,
  sendTxn,
  getFrameSigner,
} = require("../shared/helpers");
const { expandDecimals } = require("../../test/shared/utilities");

const network = process.env.HARDHAT_NETWORK || "op";

async function getOP() {
  const tokenManager = {
    address: "0xNotDeployed",
  };

  return { tokenManager };
}

async function getTestnet() {
  const tokenManager = {
    address: "0x5dc9bc3F02422DF29e856536867102E0fad5BCC2",
  };

  return { tokenManager };
}

async function getValues() {
  if (network === "op") {
    return getOP();
  }

  if (network === "testnet") {
    return getTestnet();
  }
}

async function main() {
  const signer = await getFrameSigner();

  const admin = "0x7C14D748d1eAD29127318BbB643C240050878Fe7";
  const buffer = 24 * 60 * 60;

  const { tokenManager } = await getValues();

  const timelock = await deployContract(
    "PriceFeedTimelock",
    [admin, buffer, tokenManager.address],
    "Timelock"
  );

  const deployedTimelock = await contractAt(
    "PriceFeedTimelock",
    timelock.address,
    signer
  );

  const signers = [
    "0x7C14D748d1eAD29127318BbB643C240050878Fe7", // Gov
  ];

  for (let i = 0; i < signers.length; i++) {
    const signer = signers[i];
    await sendTxn(
      deployedTimelock.setContractHandler(signer, true),
      `deployedTimelock.setContractHandler(${signer})`
    );
  }

  const keepers = [
    "0x7C14D748d1eAD29127318BbB643C240050878Fe7", // Gov
  ];

  for (let i = 0; i < keepers.length; i++) {
    const keeper = keepers[i];
    await sendTxn(
      deployedTimelock.setKeeper(keeper, true),
      `deployedTimelock.setKeeper(${keeper})`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
