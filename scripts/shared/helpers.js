const fs = require("fs");
const path = require("path");
const parse = require("csv-parse");

const network = process.env.HARDHAT_NETWORK || "testnet";

const ARBITRUM = 42161;
const AVALANCHE = 43114;

const {
  OPTIMISM_URL,
  OPTIMISM_GOERLI_URL,
  OPTIMISM_DEPLOY_KEY,
  OPTIMISM_GOERLI_DEPLOY_KEY,
} = require("../../env.json");
const { namehash } = require("ethers/lib/utils");

const providers = {
  op: new ethers.providers.JsonRpcProvider(OPTIMISM_URL),
  testnet: new ethers.providers.JsonRpcProvider(OPTIMISM_GOERLI_URL),
};

const signers = {
  op: new ethers.Wallet(OPTIMISM_DEPLOY_KEY).connect(providers.op),
  testnet: new ethers.Wallet(OPTIMISM_GOERLI_DEPLOY_KEY).connect(
    providers.testnet
  ),
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const readCsv = async (file) => {
  records = [];
  const parser = fs
    .createReadStream(file)
    .pipe(parse({ columns: true, delimiter: "," }));
  parser.on("error", function (err) {
    console.error(err.message);
  });
  for await (const record of parser) {
    records.push(record);
  }
  return records;
};

function getChainId(network) {
  if (network === "op") {
    return 10;
  }

  if (network === "testnet") {
    return 420;
  }

  throw new Error("Unsupported network");
}

async function getFrameSigner(options) {
  try {
    // const frame = new ethers.providers.JsonRpcProvider("http://127.0.0.1:1248");
    // const signer = frame.getSigner();
    const signer = signers[network];
    let networkToCheck = network;
    if (options && options.network) {
      networkToCheck = options.network;
    }
    if (getChainId(networkToCheck) !== (await signer.getChainId())) {
      throw new Error("Incorrect frame network");
    }
    return signer;
  } catch (e) {
    throw new Error(`getFrameSigner error: ${e.toString()}`);
  }
}

async function sendTxn(txnPromise, label) {
  console.info(`Processsing ${label}:`);
  const txn = await txnPromise;
  console.info(`Sending ${label}...`);
  await txn.wait(2);
  console.info(`... Sent! ${txn.hash}`);
  return txn;
}

async function callWithRetries(func, args, retriesCount = 3) {
  let i = 0;
  while (true) {
    i++;
    try {
      return await func(...args);
    } catch (ex) {
      if (i === retriesCount) {
        console.error("call failed %s times. throwing error", retriesCount);
        throw ex;
      }
      console.error("call i=%s failed. retrying....", i);
      console.error(ex.message);
    }
  }
}

async function deployContract(name, args, label, options) {
  if (!options && typeof label === "object") {
    label = null;
    options = label;
  }

  let info = name;
  if (label) {
    info = name + ":" + label;
  }
  console.log(name, args, label, options);
  const contractFactory = await ethers.getContractFactory(name);
  let contract;
  if (options) {
    contract = await contractFactory.deploy(...args, options);
  } else {
    contract = await contractFactory.deploy(...args);
  }
  const argStr = args.map((i) => `"${i}"`).join(" ");
  console.info(`Deploying ${info} ${contract.address} ${argStr}`);
  await contract.deployTransaction.wait();
  console.info("... Completed!");
  return contract;
}

async function contractAt(name, address, provider, options) {
  let contractFactory = await ethers.getContractFactory(name, options);
  if (provider) {
    contractFactory = contractFactory.connect(provider);
  }
  return await contractFactory.attach(address);
}

const tmpAddressesFilepath = path.join(
  __dirname,
  "..",
  "..",
  `.tmp-addresses-${process.env.HARDHAT_NETWORK}.json`
);

function readTmpAddresses() {
  if (fs.existsSync(tmpAddressesFilepath)) {
    return JSON.parse(fs.readFileSync(tmpAddressesFilepath));
  }
  return {};
}

function writeTmpAddresses(json) {
  const tmpAddresses = Object.assign(readTmpAddresses(), json);
  fs.writeFileSync(tmpAddressesFilepath, JSON.stringify(tmpAddresses));
}

// batchLists is an array of lists
async function processBatch(batchLists, batchSize, handler) {
  let currentBatch = [];
  const referenceList = batchLists[0];

  for (let i = 0; i < referenceList.length; i++) {
    const item = [];

    for (let j = 0; j < batchLists.length; j++) {
      const list = batchLists[j];
      item.push(list[i]);
    }

    currentBatch.push(item);

    if (currentBatch.length === batchSize) {
      console.log(
        "handling currentBatch",
        i,
        currentBatch.length,
        referenceList.length
      );
      await handler(currentBatch);
      currentBatch = [];
    }
  }

  if (currentBatch.length > 0) {
    console.log(
      "handling final batch",
      currentBatch.length,
      referenceList.length
    );
    await handler(currentBatch);
  }
}

async function updateTokensPerInterval(distributor, tokensPerInterval, label) {
  const prevTokensPerInterval = await distributor.tokensPerInterval();
  if (prevTokensPerInterval.eq(0)) {
    // if the tokens per interval was zero, the distributor.lastDistributionTime may not have been updated for a while
    // so the lastDistributionTime should be manually updated here
    await sendTxn(
      distributor.updateLastDistributionTime({ gasLimit: 1000000 }),
      `${label}.updateLastDistributionTime`
    );
  }
  await sendTxn(
    distributor.setTokensPerInterval(tokensPerInterval, { gasLimit: 1000000 }),
    `${label}.setTokensPerInterval`
  );
}

module.exports = {
  ARBITRUM,
  AVALANCHE,
  providers,
  signers,
  readCsv,
  getFrameSigner,
  sendTxn,
  deployContract,
  contractAt,
  writeTmpAddresses,
  readTmpAddresses,
  callWithRetries,
  processBatch,
  updateTokensPerInterval,
  sleep,
};
