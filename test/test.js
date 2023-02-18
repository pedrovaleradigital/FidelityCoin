const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { getRole, deploySC, deploySCNoUp, ex, pEth, bn } = require("../utils");

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

// 21 de diciembre del 2022 GMT
var startDate = 1671580800;

var makeBN = (num) => ethers.BigNumber.from(String(num));

describe("FIDELITY COIN TESTING", function () {
  var fidelityNFT, purchaseCoin, fidelityCoin;
  var owner, gnosis, alice, bob, carl, deysi;
  var fidelityToken = "FidelityCoin";
  var fidelitySymbol = "FIDO";
  var fidelityExpirationPeriod = 60;
  var decimalsToken = 18;
  var nftContractTitle = "Fidelity NFT";
  var nftSymbol = "FIDONFT";
  var lastNftId = 52;
  var ipfsCID = "QmSA58qFqb8m66e4vCWx6UcJAuq7Lt3zLU8EyGDXwDyCTc";

  before(async () => {
    [owner, gnosis, alice, bob, carl, deysi] = await ethers.getSigners();
  });

  
  async function deployFIDO() {
    fidelityCoin = await deploySC("FidelityCoin", []);
  }

  async function deployNFT() {
    fidelityNFT = await deploySC("FidelityNFT", [nftContractTitle, nftSymbol, ipfsCID, lastNftId]);
  }

  async function deployPurchaseCoin() {
    gnosis = ethers.utils.getAddress("0x6B7166eB89dAEB4a9374dC73ef46BE05e0635C20");
    purchaseCoin = await deploySC("PurchaseCoin", []);    
    purchaseCoin.setFidelityCoin(fidelityCoin.address);
    purchaseCoin.setFidelityNFT(fidelityNFT.address);
    purchaseCoin.setGnosisWallet(gnosis);
  }

  describe("FidelityCoin Smart Contract", () => {
    // Se publica el contrato antes de cada test
    beforeEach(async () => {
      await deployFIDO();
    });

    it("Verifica nombre", async () => {
      expect(await fidelityCoin.name()).to.be.equal(fidelityToken);
    });

    it("Verifica símbolo", async () => {
      expect(await fidelityCoin.symbol()).to.be.equal(fidelitySymbol);
    });

    it("Verifica Decimales ", async () => {
      expect(await fidelityCoin.decimals()).to.be.equal(decimalsToken);
    });
  });

  describe("FidelityNFT Smart Contract", () => {
    // Se publica el contrato antes de cada test
    beforeEach(async () => {
      await deployNFT();
    });

    it("Verifica nombre colección", async () => {
      expect(await fidelityNFT.name()).to.be.equal(nftContractTitle);
    });

    it("Verifica símbolo de colección", async () => {
      expect(await fidelityNFT.symbol()).to.be.equal(nftSymbol);
    });

    it("No permite acuñar sin privilegio", async () => {
      await expect(
        fidelityNFT.connect(alice).safeMint(alice.address,1)
      ).to.be.revertedWith(`AccessControl: account ${alice.address.toLowerCase()} is missing role ${MINTER_ROLE}`);
    });

    it("No permite acuñar doble id de Nft", async () => {
      //grant role
      await fidelityNFT.grantRole(MINTER_ROLE, alice.address);

      //mint //Testing whether the transfer changes the balance of the account:
      await expect(
        fidelityNFT.connect(alice).safeMint(alice.address,1)
      ).to.changeTokenBalance(fidelityNFT, alice.address, 1);

      //mint again
      await expect(
        fidelityNFT.connect(alice).safeMint(alice.address,1)
      ).to.be.revertedWith("Token is already minted");
    });

    it("Verifica rango de Nft: [1, 52]", async () => {

      await fidelityNFT.grantRole(MINTER_ROLE, alice.address);

      await expect(
        fidelityNFT.connect(alice).safeMint(alice.address,0)
      ).to.be.revertedWith("NFT: Token id out of range");

      await expect(
        fidelityNFT.connect(alice).safeMint(alice.address,53)
      ).to.be.revertedWith("NFT: Token id out of range");

    });

    it("Se pueden acuñar 52 NFTs", async () => {
      
      await fidelityNFT.grantRole(MINTER_ROLE, alice.address);

      var addressZero = "0x0000000000000000000000000000000000000000";
      for (let index = 1; index <= 52; index++) {
        
        await expect(
          fidelityNFT.connect(owner).safeMint(alice.address,index)
        ).to.emit(fidelityNFT, "Transfer")
            .withArgs(addressZero, alice.address, index);
      }

    });
  });

  describe("PurchaseCoin Smart Contract", () => {
    // Se publica el contrato antes de cada test
    beforeEach(async () => {
      await deployFIDO();
      await deployNFT();
      await deployPurchaseCoin();
    });

    it("No se puede comprar por poca cantidad de soles", async () => {
            
      await expect(
        purchaseCoin.connect(bob).purchaseFidoUsingSoles(0)
      ).to.be.revertedWith("PurchaseCoin: Not enough amount in Soles");

    });

    it("No se puede comprar por no tener fidos", async () => {
            
      await expect(
        purchaseCoin.connect(bob).purchaseFidoUsingSoles(50)
      ).to.be.revertedWith("PurchaseCoin: Not enough token balance");

    });

    it("No se puede comprar menos de la cantidad minima de fidos", async () => {

      //bob ya ha participado. Tiene 100
      await fidelityCoin.connect(owner).mint(bob.address, pEth("100"));
            
      await expect(
        purchaseCoin.connect(bob).purchaseFidoUsingSoles(30)
      ).to.be.revertedWith("PurchaseCoin: Not enough FIDOS to buy");

    });

    it("Usuario no dio permiso fidelityCoin a PurchaseCoin", async () => {
      
      //bob ya ha participado. Tiene 100
      await fidelityCoin.connect(owner).mint(bob.address, pEth("100"));
      
      await expect(
        purchaseCoin.connect(bob).purchaseFidoUsingSoles(50)
      ).to.be.revertedWith(`AccessControl: account ${purchaseCoin.address.toLowerCase()} is missing role ${MINTER_ROLE}`);

    });

    it("Verifica que se acuñe los fidos comprados", async () => {
      
      await fidelityCoin.grantRole(MINTER_ROLE, purchaseCoin.address);

      //bob ya ha participado. Tiene 1 FIDO
      await fidelityCoin.connect(owner).mint(bob.address, pEth("1"));
      
      await expect(
        purchaseCoin.connect(bob).purchaseFidoUsingSoles(50)
      ).to.changeTokenBalance(fidelityCoin, bob.address, pEth("500"));

    });

    describe("Depositando Ether para comprar FIDO", () => {
      it("No se envia la cantidad minima de ethers (500 FIDOS)", async () => {
        const transaction = {
          value: pEth("0.007813"),
        };
        
        await expect(
          purchaseCoin.connect(bob).depositEthForFido(transaction)
        ).to.be.revertedWith("PurchaseCoin: Not enoght amount of Ether");

      });

      it("Usuario no dio permiso de fidelityCoin a PurchaseCoin", async () => {
        const transaction = {
          value: pEth("8.61"),
        };
        
        await expect(
          purchaseCoin.connect(bob).depositEthForFido(transaction)
        ).to.be.revertedWith(`AccessControl: account ${purchaseCoin.address.toLowerCase()} is missing role ${MINTER_ROLE}`);

      });

      it("Se envia vuelto (ether) al usuario", async () => {
        var min = "8.61";
        var sent = "9";

        var numFidos = Math.floor(pEth(sent) * 500 / pEth(min));
        var ethers = Math.floor(numFidos * pEth(min) / 500);
        //var vuelto = pEth(sent) - ethers ; 
        //console.log('-'+ethers.toString())
        await fidelityCoin.grantRole(MINTER_ROLE, purchaseCoin.address);

        // SE ENVIA 0.007814 + 0.000010
        const transaction = {
          value: bn.from(pEth(sent)),
        };
        
        //SE ESPERA DE VUELTO: 0.000030 ==> TENDRA DE BALANCE -0-007844 + 0.000030
        await expect(
          purchaseCoin.connect(bob).depositEthForFido(transaction)
        ).to.changeEtherBalance(bob.address, bn.from('-'+ethers.toString()));

      });

      it("Gnosis safe recibe los ethers por los FIDO comprados", async () => {
        var min = "8.61";
        var sent = "9";

        var numFidos = Math.floor(pEth(sent) * 500 / pEth(min));
        var ethers = Math.floor(numFidos * pEth(min) / 500);

        await fidelityCoin.grantRole(MINTER_ROLE, purchaseCoin.address);
        const transaction = {
          value: bn.from(pEth(sent)),
        };
        
        await expect(
          purchaseCoin.connect(bob).depositEthForFido(transaction)
        ).to.changeEtherBalance(gnosis, bn.from(ethers.toString()));

      });

      it("Se valida que se obtenga fidos por el envio de ether", async () => {
        var sent = "8.61"; // 500 fidos
        await fidelityCoin.grantRole(MINTER_ROLE, purchaseCoin.address);

        // SE ENVIA 0.007814 + 0.000010
        const transaction = {
          value: bn.from(pEth(sent)),
        };
        
        //SE ESPERA OBTENER 500 FIDOS
        await expect(
          purchaseCoin.connect(bob).depositEthForFido(transaction)
        ).to.changeTokenBalance(fidelityCoin, bob.address, pEth("500"));

      });
    });

    describe("Compra de NFT", () => {
      it("Verifica rango de Nft: [1, 52]", async () => {
        
        await expect(
          purchaseCoin.connect(bob).purchaseNftById(0)
        ).to.be.revertedWith("PurchaseNFT: Token id out of range");

        await expect(
          purchaseCoin.connect(bob).purchaseNftById(53)
        ).to.be.revertedWith("PurchaseNFT: Token id out of range");

      });
      
      it("Verifica que se tenga balance para comprar NFT", async () => {

        //bob ya ha participado. Solo tiene 999
        await fidelityCoin.connect(owner).mint(bob.address, pEth("999"));

        await expect(
          purchaseCoin.connect(bob).purchaseNftById(5)
        ).to.be.revertedWith("PurchaseNFT: Not enough token balance");

      });

      it("No permite quemar sin privilegio", async () => {
        
        //bob ya ha participado. Solo tiene 99
        await fidelityCoin.connect(owner).mint(bob.address, pEth("2000"));

        await expect(
          purchaseCoin.connect(bob).purchaseNftById(5)
        ).to.be.revertedWith(`AccessControl: account ${purchaseCoin.address.toLowerCase()} is missing role ${BURNER_ROLE}`);

      });

      it("No permite acuñar sin privilegio", async () => {
        
        await fidelityCoin.grantRole(BURNER_ROLE, purchaseCoin.address);

        //bob ya ha participado. Solo tiene 99
        await fidelityCoin.connect(owner).mint(bob.address, pEth("2000"));

        await expect(
          purchaseCoin.connect(bob).purchaseNftById(5)
        ).to.be.revertedWith(`AccessControl: account ${purchaseCoin.address.toLowerCase()} is missing role ${MINTER_ROLE}`);

      });

      it("Verifica que se haya quemado la cantidad de FIDO", async () => {

        await fidelityCoin.grantRole(BURNER_ROLE, purchaseCoin.address);
        await fidelityNFT.grantRole(MINTER_ROLE, purchaseCoin.address);

        //bob ya ha participado. Solo tiene 99
        await fidelityCoin.connect(owner).mint(bob.address, pEth("2000"));

        //El precio es de 1000, se espera un cambio de -1000
        await expect(
          purchaseCoin.connect(bob).purchaseNftById(5)
        ).to.changeTokenBalance(fidelityCoin, bob.address, pEth("-1000"));
   
      });

      it("Verifica que se haya acuñado el NFT", async () => {

        await fidelityCoin.grantRole(BURNER_ROLE, purchaseCoin.address);
        await fidelityNFT.grantRole(MINTER_ROLE, purchaseCoin.address);

        //bob ya ha participado. Solo tiene 99
        await fidelityCoin.connect(owner).mint(bob.address, pEth("2000"));

        await expect(
          purchaseCoin.connect(bob).purchaseNftById(5)
        ).to.emit(purchaseCoin, "DeliverNft")
            .withArgs(bob.address, 5);
   
        const NFT = await purchaseCoin.connect(bob).getNftDetailById(5);
        
        expect(NFT.address_owner).to.equal(bob.address);
        expect(NFT.isSold).to.equal(true);
      });

      it("Verifica que se no se pueda acuñar el mismo NFT", async () => {

        await fidelityCoin.grantRole(BURNER_ROLE, purchaseCoin.address);
        await fidelityNFT.grantRole(MINTER_ROLE, purchaseCoin.address);

        //bob ya ha participado. Solo tiene 99
        await fidelityCoin.connect(owner).mint(bob.address, pEth("2000"));

        await expect(
          purchaseCoin.connect(bob).purchaseNftById(5)
        ).to.emit(purchaseCoin, "DeliverNft")
            .withArgs(bob.address, 5);
   
        await expect(
          purchaseCoin.connect(bob).purchaseNftById(5)
        ).to.be.revertedWith("PurchaseNFT: id not available");

      });
    });
    
  })
  
});
