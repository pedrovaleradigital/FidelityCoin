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
var BURNER_ROLE = getRole("BURNER_ROLE");

async function deployContracts() {
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

  /*
    let rawdata = fs.readFileSync(`${basePath}/ipfs/_metadata.json`);
    let data = JSON.parse(rawdata);
    const pricing = [];
    data.forEach((item) => {
      att=item.attributes.find(att => att.trait_type === "FIDOS to mint");
      pricing.push([item.edition,att.value]);
    });
    console.log(pricing);*/


  var gnosis = { address: ethers.utils.getAddress("0xed76c29D4B1fE37e101eAe4E02Fc3633f8aa86cd") };


  var fidelityContractName = "FidelityCoin";
  var fidelityToken = "FidelityCoin";
  var fidelitySymbol = "FIDO";
  var fidelityExpirationPeriod = 60; //Starts With 60 seconds for testing purposes
  console.log(`🥚 Deploying ${fidelityContractName}`);
  console.log(`👉 Variable fidelityContractName: ${fidelityContractName}`);
  console.log(`👉 Variable fidelityToken: ${fidelityToken}`);
  console.log(`👉 Variable fidelitySymbol: ${fidelitySymbol}`);
  console.log(`👉 Variable fidelityExpirationPeriod: ${fidelityExpirationPeriod}`);
  var fidelityContract = await deploySC(fidelityContractName, [/*fidelityToken, fidelitySymbol, fidelityExpirationPeriod*/]);
  console.log(`📝 ${fidelityContractName} Contract Addr: ${fidelityContract.address}`);
  var fidelityImplementation = await printAddress(`📣 ${fidelityContractName}`, fidelityContract.address);
  await verify(fidelityImplementation, `🔎 ${fidelityContractName}`, [/*fidelityToken, fidelitySymbol*/]);

  var airdropFidelityContractName = "AirdropFidelityCoin";
  console.log(`🥚 Deploying ${airdropFidelityContractName}`);
  var airdropFidelityContract = await deploySC(airdropFidelityContractName, []);
  console.log(`📝 ${airdropFidelityContractName} Contract Addr: ${airdropFidelityContract.address}`);
  var airdropFidelityImplementation = await printAddress(`📣 ${airdropFidelityContractName}`, airdropFidelityContract.address);

  await ex(airdropFidelityContract, "setFidelityCoinAdd", [fidelityContract.address], "GR");

  var exResult = await ex(fidelityContract, "grantRole", [MINTER_ROLE, airdropFidelityContract.address], "🤬 Error Granting Role");
  if (exResult.events[0].args["role"] == MINTER_ROLE && exResult.events[0].args["account"] == airdropFidelityContract.address) {
    console.log(`✅ Address ${airdropFidelityContract.address} has MINTER_ROLE granted in Contract ${fidelityContractName}`);
  }
  else {
    console.log(`❌ Address ${airdropFidelityContract.address} has NOT MINTER_ROLE granted in Contract ${fidelityContractName}`);
  }

  await verify(airdropFidelityImplementation, `🔎 ${airdropFidelityContractName}`, []);




  purchaseCoinContract = await deploySC("PurchaseCoin", []);
  var implementation = await printAddress("PurchaseCoin", purchaseCoinContract.address);
  await ex(purchaseCoinContract, "setFidelityCoin", [fidelityContract.address], "GR");
  await ex(purchaseCoinContract, "setFidelityNFT", [nftContract.address], "GR");
  await ex(purchaseCoinContract, "setGnosisWallet", [gnosis.address], "GR");
  var exResult = await ex(nftContract, "grantRole", [MINTER_ROLE, purchaseCoinContract.address], "🤬 Error Granting Role");
  if (exResult.events[0].args["role"] == MINTER_ROLE && exResult.events[0].args["account"] == purchaseCoinContract.address) {
    console.log(`✅ Address ${purchaseCoinContract.address} has MINTER_ROLE granted in Contract ${nftContractName}`);
  }
  else {
    console.log(`❌ Address ${purchaseCoinContract.address} has NOT MINTER_ROLE granted in Contract ${nftContractName}`);
  }
  var exResult = await ex(fidelityContract, "grantRole", [MINTER_ROLE, purchaseCoinContract.address], "🤬 Error Granting Role");
  if (exResult.events[0].args["role"] == MINTER_ROLE && exResult.events[0].args["account"] == purchaseCoinContract.address) {
    console.log(`✅ Address ${purchaseCoinContract.address} has MINTER_ROLE granted in Contract ${fidelityContractName}`);
  }
  else {
    console.log(`❌ Address ${purchaseCoinContract.address} has NOT MINTER_ROLE granted in Contract ${fidelityContractName}`);
  }
  var exResult = await ex(fidelityContract, "grantRole", [BURNER_ROLE, purchaseCoinContract.address], "🤬 Error Granting Role");
  if (exResult.events[0].args["role"] == BURNER_ROLE && exResult.events[0].args["account"] == purchaseCoinContract.address) {
    console.log(`✅ Address ${purchaseCoinContract.address} has BURNER_ROLE granted in Contract ${fidelityContractName}`);
  }
  else {
    console.log(`❌ Address ${purchaseCoinContract.address} has NOT BURNER_ROLE granted in Contract ${fidelityContractName}`);
  }
  await verify(implementation, "PurchaseCoin", []);



  console.log("😀 Finished  Deployment");
}



async function main() {

  deployContracts()
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