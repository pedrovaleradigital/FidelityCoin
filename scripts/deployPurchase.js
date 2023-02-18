require("dotenv").config();

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  upgradeSC,
  deploySCNoUp,
} = require("../utils");

//SMART CONTRACT UPGRADEABLE
async function deployPurhase() {  

  var fidelityCoin = { address: "0xa6064a4E06a2f4d96C3bB8257341Ebf00DA8d12A"};
  var fidelityNFT = { address: "0x11fdBC776B151f08d051317Eb94c585c64E413Fb"};
  var gnosis = { address: "0x6B7166eB89dAEB4a9374dC73ef46BE05e0635C20"};

  purchaseCoinContract = await deploySC("PurchaseCoin", []);
  var implementation = await printAddress("PurchaseCoin", purchaseCoinContract.address);
  
  await ex(purchaseCoinContract, "setFidelityCoin", [fidelityCoin.address], "GR");
  await ex(purchaseCoinContract, "setFidelityNFT", [fidelityNFT.address], "GR");
  await ex(purchaseCoinContract, "setGnosisWallet", [gnosis.address], "GR");

  await verify(implementation, "PublicSale", []);
}

async function upgrade() {
  var purchaseCoinProxy ={address:"0x0E941DbC6E9ba784e64948AAD9BebaF23FB5b867"};
  
  purchaseCoinContract = await upgradeSC("PurchaseCoin_v1",purchaseCoinProxy.address);
  var implementation = await printAddress("PurchaseCoin_v1", purchaseCoinContract.address);

  await verify(implementation, "PurchaseCoin_v1", []);
}

//upgrade()
deployPurhase()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
