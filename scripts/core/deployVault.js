const { deployContract, contractAt , sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")
const { errors } = require("../../test/core/Vault/helpers")

const network = (process.env.HARDHAT_NETWORK || 'op');
const tokens = require('./tokens')[network];

async function main() {
  const { nativeToken } = tokens

  const vault = await deployContract("Vault", [])
  // const vault = await contractAt("Vault", "0x004bfbe52F32784e2D0F190740317B9f9E449292")
  const usdg = await deployContract("USDG", [vault.address])
  // const usdg = await contractAt("USDG", "0x8caa7dE90271f4616C0Ede4fd9D7Df2f239f91ea")
  const router = await deployContract("Router", [vault.address, usdg.address, nativeToken.address])
  // const router = await contractAt("Router", "0x108E206cDe949583A6FC84A0B23778df54EfF00f")
  const vaultPriceFeed = await deployContract("VaultPriceFeed", [])
  // const vaultPriceFeed = await contractAt("VaultPriceFeed", "0x7b6c0585DafFE126c3729B0eDEB7Fb47Ed71B221")
  // const secondaryPriceFeed = await deployContract("FastPriceFeed", [5 * 60])


  await sendTxn(vaultPriceFeed.setMaxStrictPriceDeviation(expandDecimals(1, 28)), "vaultPriceFeed.setMaxStrictPriceDeviation") // 0.05 USD
  await sendTxn(vaultPriceFeed.setPriceSampleSpace(1), "vaultPriceFeed.setPriceSampleSpace")
  await sendTxn(vaultPriceFeed.setIsAmmEnabled(false), "vaultPriceFeed.setIsAmmEnabled")

  const glp = await deployContract("GLP", [])
  // const glp = await contractAt("GLP", "0xa68877e7E6Aa04dAF21EFFBcD2586eD1ADCbfD0C")
  await sendTxn(glp.setInPrivateTransferMode(true), "glp.setInPrivateTransferMode")
  const glpManager = await deployContract("GlpManager", [vault.address, usdg.address, glp.address, "0x86e6e9ed0541219001196adf1Fe43B4D8c5EdEA5", 0])
  await sendTxn(glpManager.setInPrivateMode(true), "glpManager.setInPrivateMode")

  await sendTxn(glp.setMinter(glpManager.address, true), "glp.setMinter")
  await sendTxn(usdg.addVault(glpManager.address), "usdg.addVault(glpManager)")

  await sendTxn(vault.initialize(
    router.address, // router
    usdg.address, // usdg
    vaultPriceFeed.address, // priceFeed
    toUsd(2), // liquidationFeeUsd
    100, // fundingRateFactor
    100 // stableFundingRateFactor
  ), "vault.initialize")

  await sendTxn(vault.setFundingRate(60 * 60, 100, 100), "vault.setFundingRate")

  await sendTxn(vault.setInManagerMode(true), "vault.setInManagerMode")
  await sendTxn(vault.setManager(glpManager.address, true), "vault.setManager")

  await sendTxn(vault.setFees(
    10, // _taxBasisPoints
    5, // _stableTaxBasisPoints
    20, // _mintBurnFeeBasisPoints
    20, // _swapFeeBasisPoints
    1, // _stableSwapFeeBasisPoints
    10, // _marginFeeBasisPoints
    toUsd(2), // _liquidationFeeUsd
    24 * 60 * 60, // _minProfitTime
    true // _hasDynamicFees
  ), "vault.setFees")

  const vaultErrorController = await deployContract("VaultErrorController", [])
  await sendTxn(vault.setErrorController(vaultErrorController.address), "vault.setErrorController")
  await sendTxn(vaultErrorController.setErrors(vault.address, errors), "vaultErrorController.setErrors")

  const vaultUtils = await deployContract("VaultUtils", [vault.address])
  await sendTxn(vault.setVaultUtils(vaultUtils.address), "vault.setVaultUtils")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
