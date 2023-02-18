require("dotenv").config();


async function upgradeFidelityNFT() {

    console.log("Upgrading FidelityNFT ...");

    var FidelityNFTProxyAdd = "0xD92f508a30F89AFdF8411BE8db50D3eD8ac6a6bA";
    const FidelityNFTUpgrade = await hre.ethers.getContractFactory("FidelityNFT");

    var fidelityNFTUpgrade = await upgrades.upgradeProxy(FidelityNFTProxyAdd, FidelityNFTUpgrade);
    try {
        await fidelityNFTUpgrade.deployTransaction.wait(5);
    } catch (error) {
        console.log(error);
    }

    var implmntAddress = await upgrades.erc1967.getImplementationAddress(fidelityNFTUpgrade.address);

    console.log("Proxy address fidelityNFTUpgrade:", fidelityNFTUpgrade.address);
    console.log("Implementation address fidelityNFTUpgrade:", implmntAddress);

    await hre.run("verify:verify", {
        address: implmntAddress,
        constructorArguments: [],
    });


}


async function main() {

    upgradeFidelityNFT()
        .catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});