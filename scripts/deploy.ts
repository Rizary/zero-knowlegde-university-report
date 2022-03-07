// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const MerkleTree = await ethers.getContractFactory("MerkleTree");
  const merkletree = await MerkleTree.deploy();

  await merkletree.deployed();

  console.log("MerkleTree deployed to:", merkletree.address);
    
      // We get the contract to deploy
  const ZkuNFTContract = await ethers.getContractFactory("ZkuNFTContract");
  const zkunft = await ZkuNFTContract.deploy();

  await zkunft.deployed();

  console.log("ZkuNFTContract deployed to:", zkunft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
