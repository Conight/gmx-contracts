const { getFrameSigner, deployContract, contractAt , sendTxn, readTmpAddresses, writeTmpAddresses } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units");
const { getArgumentForSignature } = require("typechain");

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function getOP() {
  return { vaultAddress: "0xNotDeployed", gasLimit: 12500000 }
}

async function getTestnet() {
  return { vaultAddress: "0x004bfbe52F32784e2D0F190740317B9f9E449292", gasLimit: 12500000 }
}

async function getValues() {
  if (network === "op") {
    return await getOP()
  } else if (network === "testnet") {
    return await getTestnet()
  }
}

async function main() {
  const { vaultAddress, gasLimit } = await getValues()
  const gov = { address: "0x7C14D748d1eAD29127318BbB643C240050878Fe7" }
  const shortsTracker = await deployContract("ShortsTracker", [vaultAddress], "ShortsTracker", { gasLimit })
  await sendTxn(shortsTracker.setGov(gov.address), "shortsTracker.setGov")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
