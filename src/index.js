import { BigNumber, Contract, providers, ethers, utils } from "ethers";
 


var bttn = document.getElementById("test");
bttn.addEventListener("click", async function () {
    // if (!window.ethereum) {
    //     throw Error("Metamask no esta instalado");
    // }

    // console.log("Si esta instalado")
    // alert("ss")
  if (window.ethereum) {
    [account] = await ethereum.request({
      method: "eth_requestAccounts",
    });
    console.log("Billetera metamask", account);

    provider = new providers.Web3Provider(window.ethereum);
    signer = provider.getSigner(account);
    window.signer = signer;
  }
});

document.getElementById("comprar_producto").addEventListener("click", async function () {
 
});

document.getElementById("comprar_producto").addEventListener("click", async function () {
 
});