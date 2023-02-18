import { BigNumber, Contract, providers, ethers, utils, Signer } from "ethers";

import airdropAbi from "../artifacts/contracts/AirdropFidelityCoin.sol/AirdropFidelityCoin.json";
import fidelityCoinAbi from "../artifacts/contracts/FidelityCoin.sol/FidelityCoin.json";
import fidelityNftAbi from "../artifacts/contracts/FidelityNFT.sol/FidelityNFT.json";
import purchaseCoinAbi from "../artifacts/contracts/PurchaseCoin.sol/PurchaseCoin.json";

window.ethers = ethers;

var provider, signer, account;
var airdropContract, fidelityCoinContract, fidelityNftContract, purchaseCoinContract;

var airdropAddress = "0x40EA8f4399ff7B9e5A796c51d9D3aE2a0b92Fa68";
var fidelityCoinAddress = "0x80170Fe3fC29056aB6aa65cbE16f2791C030ebeC";
var fidelityNftAddress = "0xD92f508a30F89AFdF8411BE8db50D3eD8ac6a6bA";
var purchaseCoinAddress = "0xD4d974d4fFEF4e4a283487323d7edfC18ED71F90";

// REQUIRED
// Conectar con metamask
function initSmartContracts() {

  console.log("Setting Provider");
  provider = new providers.Web3Provider(window.ethereum);

  console.log("Airdrop Contract");
  airdropContract = new Contract(airdropAddress, airdropAbi.abi, provider);
  console.log(airdropContract);

  console.log("FidelityCoin Contract");
  fidelityCoinContract = new Contract(fidelityCoinAddress, fidelityCoinAbi.abi, provider);
  console.log(fidelityCoinContract);

  console.log("FidelityNFT Contract");
  fidelityNftContract = new Contract(fidelityNftAddress, fidelityNftAbi.abi, provider);
  console.log(fidelityNftContract);

  console.log("PurchaseCoin Contract");
  purchaseCoinContract = new Contract(purchaseCoinAddress, purchaseCoinAbi.abi, provider);
  console.log(purchaseCoinContract);

}

function addListenerConnectToMetamask() {
  console.log("Adding Listener to Connect Button");
  var connectButton = document.getElementById("connect");
  connectButton.addEventListener("click", async function () {
    console.log("Connect to Metamask Clicked");
    if (window.ethereum) {
      document.getElementById("connectedAddress").innerHTML = "";
      document.getElementById("connectedChain").innerHTML = "";
      document.getElementById("connectError").innerHTML = "";
      document.getElementById("fidoBalance").innerHTML = "";
      document.getElementById("fidoSecondsToExpire").innerHTML = "";
      account = "";
      signer = "";
      await ethereum
        .request({ method: "eth_requestAccounts" })
        .then((result) => {
          console.log("Result:", result);
          [account] = result;
          console.log("Cuenta:", account);
          document.getElementById("connectedAddress").innerHTML = account;
          document.getElementById("connectedChain").innerHTML = ethereum.chainId;
          signer = provider.getSigner(account);
        })
        .catch((err) => {
          document.getElementById("connectError").innerHTML = "Error: " + err.message;
        });
    }
  });
}

function addListenerFIDObalance() {
  console.log("Adding Listener for FIDO Balance");
  var fidoUpdateButton = document.getElementById("fidoUpdate");
  fidoUpdateButton.addEventListener("click", async function () {
    console.log("FIDO Balance Button Clicked");
    console.log("Getting Balance...");
    var balance = await fidelityCoinContract.balanceOf(account);
    document.getElementById("fidoBalance").innerHTML = ethers.utils.formatUnits(balance, 18);
    console.log("Getting Seconds...");
    var secondsToExpire = await fidelityCoinContract.secondsToExpire(account);
    document.getElementById("fidoSecondsToExpire").innerHTML = secondsToExpire;
  })
}

function addListenerAirdropBuyer() {
  console.log("Adding Listener for Airdrop Button");
  var airdropButton = document.getElementById("airdropButton");
  airdropButton.addEventListener("click", async function () {
    console.log("Airdrop Button Clicked");
    document.getElementById("airdropError").innerHTML = "";
    var address = document.getElementById("airdropAddressInput").value;
    var amount = document.getElementById("airdropAmountInput").value;
    console.log("Airdropping:", address, amount);
    var txAirdrop = await airdropContract
      .connect(signer)
      .participateInAirdropFC(address, amount)
      .catch((err) => {
        document.getElementById("airdropError").innerHTML = "Error: " + err.message;
      });
    var response = await txAirdrop.wait(1);
    console.log(response.transactionHash);
  })
}

function addListenerPurchaseById() {
  console.log("Adding Listener for Purchase Button");
  var purchaseButton = document.getElementById("purchaseButton");
  purchaseButton.addEventListener("click", async function () {
    console.log("Purchase By Id Button Clicked");
    document.getElementById("purchaseError").innerHTML = "";
    var tokenId = document.getElementById("purchaseInput").value;
    console.log("Token:", tokenId);
    console.log("Iniciando TX. Espere...");
    if (signer && tokenId>0 && tokenId<53){
    var txPurchase = await purchaseCoinContract
      .connect(signer)
      .purchaseNftById(tokenId)
      .catch((err) => {
        document.getElementById("purchaseError").innerHTML = "Error: " + err.message;
      });
    var response = await txPurchase.wait(1);
    console.log(response.transactionHash);
    }
    else{
      document.getElementById("purchaseError").innerHTML = "Error: Debe iniciar sesión y colocar un Token Válido";
    }
  })
}

function addListenerPurchaseWithEth() {
  console.log("Adding Listener for Purchase With Eth Button");
  var purchaseEthButton = document.getElementById("purchaseEthButton");
  purchaseEthButton.addEventListener("click", async function () {
    console.log("Purchase With Eth Button Clicked");
    document.getElementById("purchaseEthError").innerHTML = "";
    console.log("Iniciando TX. Espere...");
    if (signer){
    var txPurchaseWithEth = await pubSContract
      .connect(signer)
      .depositEthForARandomNft({
        value: BigNumber.from("10000000000000000")
      })
      .catch((err) => {
        document.getElementById("purchaseEthError").innerHTML = "Error: " + err.message;
      });
    var response = await txPurchaseWithEth.wait(1);
    console.log(response.transactionHash);
    }
    else{
      document.getElementById("purchaseEthError").innerHTML = "Error: Debe iniciar sesión";
    }
  })
}

function addListenerSendEth() {
  console.log("Adding Listener for Send Ether Button");
  var sendEtherButton = document.getElementById("sendEtherButton");
  sendEtherButton.addEventListener("click", async function () {
    console.log("Send Ether Button Clicked");
    document.getElementById("sendEtherError").innerHTML = "";
    console.log("Iniciando TX. Espere...");
    if (signer) {
      var txSendEther = await signer.sendTransaction({
        to: pubSContractAdd,
        value: BigNumber.from("10000000000000000")
      })
        .catch((err) => {
          document.getElementById("sendEtherError").innerHTML = "Error: " + err.message;
        });
      var response = await txSendEther.wait(1);
      console.log(response.transactionHash);
    }
    else {
      document.getElementById("sendEtherError").innerHTML = "Error: Debe iniciar sesión";
    }
  })
}

function setUpListeners() {
  // Connect to Metamask
  addListenerConnectToMetamask();
  addListenerFIDObalance();
  addListenerAirdropBuyer();
  //addListenerApprove();
  addListenerPurchaseById();
  //addListenerPurchaseWithEth();
  //addListenerSendEth();
}

function setUpEventsContracts() {
  fidelityNftContract.on ("Transfer",(from,to,tokenId)=>{
    document.getElementById("nftList")
      .innerHTML=`<div>Transfer from: ${from} to: ${to} Token: ${tokenId}</div>`+document.getElementById("nftList").innerHTML;
  })
}


async function setUp() {
  //console.log("init(window.ethereum)");
  //init(window.ethereum);
  console.log("initSCsGoerli()");
  initSmartContracts();
  console.log("setUpListeners()");
  await setUpListeners();
  console.log("setUpEventsContracts()");
  setUpEventsContracts();
}

console.log("Setting Up...");
setUp()
  .then()
  .catch((e) => console.log(e));
console.log("setUp Finished...");

