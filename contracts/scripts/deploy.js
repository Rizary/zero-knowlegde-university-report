const hre = require("hardhat");

async function main() {
    // --------- PlonkVerifier ---------------------

    const contractFactoryPlonkVerifier = await hre.ethers.getContractFactory(
        "PlonkVerifier"
    );
    const contractPlonkVerifier = await contractFactoryPlonkVerifier.deploy();
    await contractPlonkVerifier.deployed();
    console.log(
        "PlonkVerifier Contract deployed to:",
        contractPlonkVerifier.address
    );
    
    // --------- EventFactory ---------------------
    const contractFactoryEventFactory = await hre.ethers.getContractFactory("EventFactory");
    const contractEventFactory = await contractFactoryEventFactory.deploy();
    await contractEventFactory.deployed();
    console.log("EventFactory Contract deployed to:", contractEventFactory.address);

    // // --------- Event ---------------------
    // const contractFactoryEvent = await hre.ethers.getContractFactory("Event");
    // const contractEvent= await contractFactoryEvent.deploy();
    // await contractEvent.deployed();
    // console.log("Event Contract deployed to:", contractEvent.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
