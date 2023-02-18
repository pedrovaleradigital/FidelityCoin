const { expect } = require("chai");
const { ethers } = require("hardhat");

const getRole = (role) =>
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

describe("AIRDROP TESTING", function () {
  var AirdropFidelityCoin;
  var FidelityCoinAdd = ethers.utils.getAddress("0x890ECD3d23Ff71c58Fd1E847dCCAf0bC601a3cd3");
  var owner, alice, bob, carl, deysi, estefan;

  before(async () => {
    [owner, alice, bob, carl, deysi, estefan] = await ethers.getSigners();
  });

  describe("Set Up", () => {
    it("Publicar los contratos", async () => {

      // publicar AirdropONEUpgradeable
      AirdropFidelityCoin = await hre.ethers.getContractFactory(
        "AirdropFidelityCoin"
      );
      AirdropFidelityCoin = await hre.upgrades.deployProxy(
        AirdropFidelityCoin,
        { kind: "uups" }
      );

      // Set Up
      await AirdropFidelityCoin.setFidelityCoinAdd(FidelityCoinAdd);

    });
  });


  describe("AidropFidelityCoin", () => {
      it("Address correcto de FidelityCoin", async () => {
        var tokenAdd = await AirdropFidelityCoin.getFidelityCoinAdd();
        expect(tokenAdd).to.be.equal(FidelityCoinAdd);
      });

  });




});