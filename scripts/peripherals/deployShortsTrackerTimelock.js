const {
  deployContract,
  contractAt,
  sendTxn,
  getFrameSigner
} = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units");
const { getArgumentForSignature } = require("typechain");

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

async function getOP() {
  return {
    handlers: [
      "0xNotDeployed", // X Shorts Tracker Keeper
    ]
  }
}

async function getTestnet() {
  return {
    handlers: [
      "0x7C14D748d1eAD29127318BbB643C240050878Fe7", // X Shorts Tracker Keeper
    ]
  }
}

async function getValues() {
  if (network === "op") {
    return await getOP()
  }

  if (network === "testnet") {
    return await getTestnet()
  }

  throw new Error("No values for network " + network)
}

async function main() {
  const signer = await getFrameSigner()

  const admin = "0x7C14D748d1eAD29127318BbB643C240050878Fe7"
  const { handlers } = await getValues()

  const buffer = 60 // 60 seconds
  const updateDelay = 300 // 300 seconds, 5 minutes
  const maxAveragePriceChange = 20 // 0.2%
  let shortsTrackerTimelock = await deployContract("ShortsTrackerTimelock", [admin, buffer, updateDelay, maxAveragePriceChange])
  shortsTrackerTimelock = await contractAt("ShortsTrackerTimelock", shortsTrackerTimelock.address, signer)

  console.log("Setting handlers")
  for (const handler of handlers) {
    await sendTxn(
      shortsTrackerTimelock.setContractHandler(handler, true),
      `shortsTrackerTimelock.setContractHandler ${handler}`
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
