const { ethers } = require("hardhat");

// Usage: CONTRACT=0x... npx hardhat run scripts/interact.js --network trustkeys
//    or  CONTRACT=0x... npx hardhat run scripts/interact.js  (local)
async function main() {
  const addr = process.env.CONTRACT;
  if (!addr) throw new Error("Set CONTRACT=0x... env var");

  const r = await ethers.getContractAt("ClassRegistry", addr);
  console.log("memberCount:", (await r.memberCount()).toString());
  console.log("owner:", await r.owner());

  const evs = await r.queryFilter(r.filters.Registered());
  console.log(`Registered events: ${evs.length}`);
  evs.forEach((e) => console.log(" ", e.args.who, "->", e.args.name));

  // demo getAllMembers (homework extra view)
  try {
    const [addrs, names] = await r.getAllMembers();
    console.log("getAllMembers:", addrs.length);
    addrs.forEach((a, i) => console.log(`  [${i}] ${a} = ${names[i]}`));
  } catch (e) {
    console.log("getAllMembers not available:", e.message);
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
