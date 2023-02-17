require("dotenv").config();
const basePath = process.cwd();
const fs = require("fs");

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require("../utils");

var MINTER_ROLE = getRole("MINTER_ROLE");

async function deployMumbaiContracts() {
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


  let rawdata = fs.readFileSync(`${basePath}/ipfs/_metadata.json`);
  let data = JSON.parse(rawdata);
  const pricing = [];
  data.forEach((item) => {
    att=item.attributes.find(att => att.trait_type === "FIDOS to mint");
    pricing.push([item.edition,att.value]);
  });
  console.log(pricing);
  console.log("😀 Finished Mumbai Deployment");
}


async function deployGoerliContracts() {
  console.log("🙏 Deploying Göerli oriented Contracts");
  // gnosis safe
  // Crear un gnosis safe en https://gnosis-safe.io/app/
  // Extraer el address del gnosis safe y pasarlo al contrato con un setter*/
  var gnosis = { address: ethers.utils.getAddress("0xe592609c24e8dc84c82edf7a1281a9e15d259bcb") };


  var fidelityContractName = "FidelityCoin";
  var fidelityToken = "FidelityCoin";
  var fidelitySymbol = "FIDO";
  var fidelityExpirationPeriod = 60; //Starts With 60 seconds for testing purposes
  console.log(`🥚 Deploying ${fidelityContractName}`);
  console.log(`👉 Variable fidelityContractName: ${fidelityContractName}`);
  console.log(`👉 Variable fidelityToken: ${fidelityToken}`);
  console.log(`👉 Variable fidelitySymbol: ${fidelitySymbol}`);
  console.log(`👉 Variable fidelityExpirationPeriod: ${fidelityExpirationPeriod}`);
  var fidelityContract = await deploySC(fidelityContractName, [fidelityToken, fidelitySymbol, fidelityExpirationPeriod]);
  console.log(`📝 ${fidelityContractName} Contract Addr: ${fidelityContract.address}`);
  var fidelityImplementation = await printAddress(`📣 ${fidelityContractName}`, fidelityContract.address);
  await verify(fidelityImplementation, `🔎 ${fidelityContractName}`, [fidelityToken, fidelitySymbol]);




  console.log("😀 Finished Göerli Deployment");
}

async function deployBoth() {
  await deployMumbaiContracts()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  await deployGoerliContracts()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}



async function main() {
  var networkName = process.env.HARDHAT_NETWORK;
  if (!networkName) {
    console.log("🤡 Deploying to Local Hardhat");
    deployBoth();
  }
  else {
    console.log(`💪 Deploying to: ${networkName}`);
    if (networkName == "mumbai") {
      deployMumbaiContracts()
        .catch((error) => {
          console.error(error);
          process.exitCode = 1;
        });
    }
    else if (networkName == "goerli") {
      deployGoerliContracts()
        .catch((error) => {
          console.error(error);
          process.exitCode = 1;
        });
    }
    else {
      console.log("Not deployable contract for this network.");
    }
  }
  }

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});