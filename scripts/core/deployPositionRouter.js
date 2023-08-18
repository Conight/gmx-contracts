const { getFrameSigner, deployContract, contractAt , sendTxn, readTmpAddresses, writeTmpAddresses } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

const {
  ARBITRUM_URL,
  ARBITRUM_CAP_KEEPER_KEY,
  OPTIMISM_GOERLI_URL,
  OPTIMISM_GOERLI_CAP_KEEPER_KEY,
} = require("../../env.json")

async function getOP(signer) {
  const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_URL)
  const capKeeperWallet = new ethers.Wallet(ARBITRUM_CAP_KEEPER_KEY).connect(provider)

  const vault = await contractAt("Vault", "0xNotDeployed")
  const timelock = await contractAt("Timelock", await vault.gov(), signer)
  const router = await contractAt("Router", await vault.router(), signer)
  const weth = await contractAt("WETH", tokens.nativeToken.address)
  const referralStorage = await contractAt("ReferralStorage", "0xe6fab3F0c7199b0d34d7FbE83394fc0e0D06e99d")
  const shortsTracker = await contractAt("ShortsTracker", "0xf58eEc83Ba28ddd79390B9e90C4d3EbfF1d434da", signer)
  const shortsTrackerTimelock = await contractAt("ShortsTrackerTimelock", "0xf58eEc83Ba28ddd79390B9e90C4d3EbfF1d434da", signer)
  const depositFee = "30" // 0.3%
  const minExecutionFee = "100000000000000" // 0.0001 ETH

  return {
    capKeeperWallet,
    vault,
    timelock,
    router,
    weth,
    referralStorage,
    shortsTracker,
    shortsTrackerTimelock,
    depositFee,
    minExecutionFee,
    positionKeepers
  }
}

async function getTestnet(signer) {
  const provider = new ethers.providers.JsonRpcProvider(OPTIMISM_GOERLI_URL)
  const capKeeperWallet = new ethers.Wallet(OPTIMISM_GOERLI_CAP_KEEPER_KEY).connect(provider)

  const vault = await contractAt("Vault", "0xe84D177aC9F1815D34423Cb71b10490182E97252")
  const timelock = await contractAt("Timelock", await vault.gov(), signer)
  const router = await contractAt("Router", await vault.router(), signer)
  const weth = await contractAt("WETH", tokens.nativeToken.address)
  const referralStorage = await contractAt("ReferralStorage", "0x827ED045002eCdAbEb6e2b0d1604cf5fC3d322F8")
  const shortsTracker = await contractAt("ShortsTracker", "0x86e6e9ed0541219001196adf1Fe43B4D8c5EdEA5", signer)
  const shortsTrackerTimelock = await contractAt("ShortsTrackerTimelock", "0x464d813E84C7704D351a3E6B40123B8472805c3e", signer)
  const depositFee = "30" // 0.3%
  const minExecutionFee = "20000000000000000" // 0.02 AVAX

  return {
    capKeeperWallet,
    vault,
    timelock,
    router,
    weth,
    referralStorage,
    shortsTracker,
    shortsTrackerTimelock,
    depositFee,
    minExecutionFee
  }
}

async function getValues(signer) {
  if (network === "op") {
    return getOP(signer)
  }

  if (network === "testnet") {
    return getTestnet(signer)
  }
}

async function main() {
  const signer = await getFrameSigner()

  const {
    capKeeperWallet,
    vault,
    timelock,
    router,
    weth,
    shortsTracker,
    shortsTrackerTimelock,
    depositFee,
    minExecutionFee,
    referralStorage
  } = await getValues(signer)

  // const positionUtils = await deployContract("PositionUtils", [])
  const positionUtils = await contractAt("PositionUtils", "0x40BAD393a7910033487466B4e2d1727389202e2A");

  // const referralStorageGov = await contractAt("Timelock", await referralStorage.gov(), signer)

  const positionRouterArgs = [vault.address, router.address, weth.address, shortsTracker.address, depositFee, minExecutionFee]
  const positionRouter = await deployContract("PositionRouter", positionRouterArgs, "PositionRouter", {
      libraries: {
        "contracts/core/PositionUtils.sol:PositionUtils": positionUtils.address
      }
  })

  // await sendTxn(positionRouter.setReferralStorage(referralStorage.address), "positionRouter.setReferralStorage")
  // await sendTxn(referralStorageGov.signalSetHandler(referralStorage.address, positionRouter.address, true), "referralStorage.signalSetHandler(positionRouter)")

  await sendTxn(shortsTrackerTimelock.signalSetHandler(positionRouter.address, true), "shortsTrackerTimelock.signalSetHandler(positionRouter)")

  await sendTxn(router.addPlugin(positionRouter.address), "router.addPlugin")

  await sendTxn(positionRouter.setDelayValues(0, 180, 30 * 60), "positionRouter.setDelayValues")
  await sendTxn(timelock.setContractHandler(positionRouter.address, true), "timelock.setContractHandler(positionRouter)")

  await sendTxn(positionRouter.setGov(await vault.gov()), "positionRouter.setGov")

  await sendTxn(positionRouter.setAdmin(capKeeperWallet.address), "positionRouter.setAdmin")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
