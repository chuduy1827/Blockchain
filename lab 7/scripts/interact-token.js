const hre = require("hardhat");

async function main() {
  const tokenAddress = process.env.TOKEN;
  const recipient = process.env.TO;
  const amountText = process.env.AMOUNT || "100";

  if (!tokenAddress || !recipient) {
    throw new Error("Set TOKEN and TO, for example TOKEN=0x... TO=0x...");
  }

  const [sender] = await hre.ethers.getSigners();
  const token = await hre.ethers.getContractAt("ClassToken", tokenAddress);
  const amount = hre.ethers.parseUnits(amountText, 18);
  const tx = await token.transfer(recipient, amount);
  const receipt = await tx.wait();
  const recipientBalance = await token.balanceOf(recipient);

  console.log(`sender: ${sender.address}`);
  console.log(`recipient: ${recipient}`);
  console.log(`amount: ${amountText} CTK`);
  console.log(`tx: ${receipt.hash}`);
  console.log(`recipient balance: ${hre.ethers.formatUnits(recipientBalance, 18)} CTK`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
