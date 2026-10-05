const hre = require("hardhat");

async function main() {
  const Registry = await hre.ethers.getContractFactory("ClassRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const addr = await registry.getAddress();
  console.log("ClassRegistry deployed at:", addr);
  console.log("tx hash:", registry.deploymentTransaction().hash);
  console.log("owner:", await registry.owner());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
