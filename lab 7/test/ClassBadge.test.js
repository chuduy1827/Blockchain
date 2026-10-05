const { expect } = require("chai");
const { ethers } = require("hardhat");

function decodeDataUri(uri, expectedPrefix) {
  const [prefix, encoded] = uri.split(",", 2);
  expect(prefix).to.equal(expectedPrefix);
  return Buffer.from(encoded, "base64").toString("utf8");
}

describe("ClassBadge", function () {
  async function fixture() {
    const [owner, student, other] = await ethers.getSigners();
    const Badge = await ethers.getContractFactory("ClassBadge");
    const badge = await Badge.deploy(owner.address);
    await badge.waitForDeployment();
    return { badge, owner, student, other };
  }


  it("has the expected collection metadata and owner", async function () {
    const { badge, owner } = await fixture();
    expect(await badge.name()).to.equal("ClassBadge");
    expect(await badge.symbol()).to.equal("BADGE");
    expect(await badge.owner()).to.equal(owner.address);
  });

  it("only lets the owner mint, uses token IDs from zero, and emits Transfer", async function () {
    const { badge, owner, student, other } = await fixture();

    await expect(badge.connect(other).mint(student.address, "Alice"))
      .to.be.revertedWithCustomError(badge, "OwnableUnauthorizedAccount")
      .withArgs(other.address);

    await expect(badge.connect(owner).mint(student.address, "Alice"))
      .to.emit(badge, "Transfer")
      .withArgs(ethers.ZeroAddress, student.address, 0);

    expect(await badge.ownerOf(0)).to.equal(student.address);
    expect(await badge.totalMinted()).to.equal(1n);
  });

  it("rejects an empty student name", async function () {
    const { badge, owner, student } = await fixture();
    await expect(badge.connect(owner).mint(student.address, ""))
      .to.be.revertedWithCustomError(badge, "EmptyName");
  });

  it("decodes on-chain JSON and nested base64 SVG metadata", async function () {
    const { badge, owner, student } = await fixture();
    await badge.connect(owner).mint(student.address, "Nguyen Van A");

    const uri = await badge.tokenURI(0);
    const json = decodeDataUri(uri, "data:application/json;base64");
    const meta = JSON.parse(json);
    const studentAttribute = meta.attributes.find(
      (attribute) => attribute.trait_type === "Student"
    );

    expect(meta.name).to.equal("Blockchain Class Badge #0");
    expect(meta.description).to.include("Metadata and image live entirely on-chain");
    expect(studentAttribute.value).to.equal("Nguyen Van A");
    expect(meta.image).to.match(/^data:image\/svg\+xml;base64,/);

    const svg = decodeDataUri(meta.image, "data:image/svg+xml;base64");
    expect(svg).to.include("Blockchain Class");
    expect(svg).to.include("Nguyen Van A");
    expect(svg).to.include("Badge #0");
  });

  it("reverts for an unminted token ID", async function () {
    const { badge } = await fixture();
    await expect(badge.tokenURI(0))
      .to.be.revertedWithCustomError(badge, "ERC721NonexistentToken")
      .withArgs(0);
  });

  it("increments token IDs and preserves each student's metadata", async function () {
    const { badge, owner, student, other } = await fixture();
    await badge.connect(owner).mint(student.address, "Alice");
    await badge.connect(owner).mint(other.address, "Bob");

    expect(await badge.ownerOf(0)).to.equal(student.address);
    expect(await badge.ownerOf(1)).to.equal(other.address);
    expect(await badge.totalMinted()).to.equal(2n);

    const first = JSON.parse(
      decodeDataUri(await badge.tokenURI(0), "data:application/json;base64")
    );
    const second = JSON.parse(
      decodeDataUri(await badge.tokenURI(1), "data:application/json;base64")
    );
    expect(first.attributes.find((a) => a.trait_type === "Student").value).to.equal("Alice");
    expect(second.attributes.find((a) => a.trait_type === "Student").value).to.equal("Bob");
  });
});
