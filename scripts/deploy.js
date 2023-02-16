require("dotenv").config();

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require("../utils");

var MINTER_ROLE = getRole("MINTER_ROLE");

async function deployNftContract() {
  await console.log("🙏 Deploying Contracts");
  var relayerAddress = ethers.utils.getAddress("0x70f26499b849168744f4fb8fd8cce7b08c458e42");
  var ipfsCID = "QmSA58qFqb8m66e4vCWx6UcJAuq7Lt3zLU8EyGDXwDyCTc";
  var nftContractName = "FidelityNFT";
  var nftContractTitle = "Fidelity NFT";
  var nftSymbol = "FIDONFT";
  var lastNftId = 52;

  console.log(`🥚 Deploying ${nftContractName}`);
  console.log(`👉 Variable nftContractName: ${nftContractName}`);
  console.log(`👉 Variable nftContractTitle: ${nftContractTitle}`);
  console.log(`👉 Variable nftSymbol: ${nftSymbol}`);
  console.log(`👉 Variable ipfsCID: ${ipfsCID}`);
  console.log(`👉 Variable lastNftId: ${lastNftId}`);
  var nftContract = await deploySC(nftContractName, [nftContractTitle, nftSymbol, ipfsCID, lastNftId]);
  await (console.log(`📝 ${nftContractName} Contract Addr: ${nftContract.address} 🟢 Configure in AutoTask`));
  var nftImplementation = await printAddress(`📣 ${nftContractName}`, nftContract.address);
  // set up
  var exResult = await ex(nftContract, "grantRole", [MINTER_ROLE, relayerAddress], "🤬 Error Granting Role");
  if (exResult.events[0].args["role"] == MINTER_ROLE && exResult.events[0].args["account"] == relayerAddress) {
    console.log(`✅ Address ${relayerAddress} has MINTER_ROLE granted`);
  }
  else {
    console.log(`❌ Address ${relayerAddress} has NOT MINTER_ROLE granted`);
  }
  await verify(nftImplementation, `🔎 ${nftContractName}`, []);
  console.log("😀 Finished Contract Deployment");
}

async function main() {
  var networkName = process.env.HARDHAT_NETWORK;
  if (!networkName) {
    console.log("🤡 Deploying to Local Hardhat");
  }
  else {
    console.log(`💪 Deploying to: ${networkName}`);
  }
  deployNftContract()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});