const hre = require("hardhat");

function decodeBase64DataUri(uri, expectedPrefix) {
  const [prefix, encoded] = uri.split(",", 2);
  if (prefix !== expectedPrefix || !encoded) {
    throw new Error(`Unexpected data URI prefix: ${prefix}`);
  }
  return Buffer.from(encoded, "base64").toString("utf8");
}

async function main() {
  const registry = process.env.REGISTRY;
  const tokenId = process.env.TOKEN_ID || "0";

  if (!registry) {
    throw new Error("Set REGISTRY=0xBadgeAddress");
  }

  const badge = await hre.ethers.getContractAt("ClassBadge", registry);
  const uri = await badge.tokenURI(tokenId);
  const jsonText = decodeBase64DataUri(uri, "data:application/json;base64");
  const metadata = JSON.parse(jsonText);
  const svg = decodeBase64DataUri(metadata.image, "data:image/svg+xml;base64");

  console.log("JSON metadata:");
  console.log(JSON.stringify(metadata, null, 2));
  console.log("\nSVG image:");
  console.log(svg);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
