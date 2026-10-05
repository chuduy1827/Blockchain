const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const Badge = await hre.ethers.getContractFactory("ClassBadge");
  const badge = await Badge.deploy(deployer.address);
  await badge.waitForDeployment();

  console.log(`deployer: ${deployer.address}`);
  console.log(`ClassBadge: ${await badge.getAddress()}`);
  console.log(`tx: ${badge.deploymentTransaction().hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
