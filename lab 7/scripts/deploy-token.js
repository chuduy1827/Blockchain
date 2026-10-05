const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const Token = await hre.ethers.getContractFactory("ClassToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();

  console.log(`deployer: ${deployer.address}`);
  console.log(`ClassToken: ${await token.getAddress()}`);
  console.log(`tx: ${token.deploymentTransaction().hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
