require("dotenv").config();


async function upgradeContract(_contractName, _contractAddress) {

    console.log(`Upgrading ${_contractName} ...`);

    const ContractUpgrade = await hre.ethers.getContractFactory(_contractName);

    var contractUpgrade = await upgrades.upgradeProxy(_contractAddress, ContractUpgrade);
    try {
        await contractUpgrade.deployTransaction.wait(5);
    } catch (error) {
        console.log(error);
    }

    var implUpgradeAddress = await upgrades.erc1967.getImplementationAddress(contractUpgrade.address);

    console.log(`${_contractName} Proxy address: ${contractUpgrade.address}`);
    console.log(`${_contractName} Impl. address: ${implUpgradeAddress}`);

    await hre.run("verify:verify", {
        address: implUpgradeAddress,
        constructorArguments: [],
    });
}


async function main() {

    upgradeContract("FidelityNFT","0xD92f508a30F89AFdF8411BE8db50D3eD8ac6a6bA")
        .catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});