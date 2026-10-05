const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("ClassRegistry — Lab 6 + Homework", function () {
  async function deployFixture() {
    const [owner, alice, bob, carol] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ClassRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();
    return { registry, owner, alice, bob, carol };
  }

  it("1. owner được gán bằng deployer (immutable)", async function () {
    const { registry, owner } = await loadFixture(deployFixture);
    expect(await registry.owner()).to.equal(owner.address);
  });

  it("2. register thành công + emit Registered + isRegistered/nameOf/memberCount", async function () {
    const { registry, alice } = await loadFixture(deployFixture);
    await expect(registry.connect(alice).register("Alice"))
      .to.emit(registry, "Registered").withArgs(alice.address, "Alice");
    expect(await registry.isRegistered(alice.address)).to.equal(true);
    expect(await registry.nameOf(alice.address)).to.equal("Alice");
    expect(await registry.memberCount()).to.equal(1);
    const [who, name] = await registry.memberAt(0);
    expect(who).to.equal(alice.address);
    expect(name).to.equal("Alice");
  });

  it("3. revert EmptyName khi tên rỗng", async function () {
    const { registry, alice } = await loadFixture(deployFixture);
    await expect(registry.connect(alice).register(""))
      .to.be.revertedWithCustomError(registry, "EmptyName");
  });

  it("4. revert AlreadyRegistered khi đăng ký lần 2 cùng địa chỉ", async function () {
    const { registry, alice } = await loadFixture(deployFixture);
    await registry.connect(alice).register("Alice");
    await expect(registry.connect(alice).register("Alice 2"))
      .to.be.revertedWithCustomError(registry, "AlreadyRegistered")
      .withArgs(alice.address);
  });

  it("5. nhiều người đăng ký — memberCount tăng, memberAt đúng thứ tự", async function () {
    const { registry, alice, bob } = await loadFixture(deployFixture);
    await registry.connect(alice).register("Alice");
    await registry.connect(bob).register("Bob");
    expect(await registry.memberCount()).to.equal(2);
    expect((await registry.memberAt(1)).name).to.equal("Bob");
  });

  it("6. deregister chỉ owner được gọi — non-owner revert NotOwner", async function () {
    const { registry, alice, bob } = await loadFixture(deployFixture);
    await registry.connect(alice).register("Alice");
    await expect(registry.connect(bob).deregister(alice.address))
      .to.be.revertedWithCustomError(registry, "NotOwner");
  });

  it("7. owner deregister: swap-and-pop, giữ mảng dense, event Deregistered", async function () {
    const { registry, alice, bob, carol } = await loadFixture(deployFixture);
    await registry.connect(alice).register("Alice");
    await registry.connect(bob).register("Bob");
    await registry.connect(carol).register("Carol");
    // remove Alice (index 0) -> Carol should move to 0
    await expect(registry.deregister(alice.address))
      .to.emit(registry, "Deregistered").withArgs(alice.address);
    expect(await registry.isRegistered(alice.address)).to.equal(false);
    expect(await registry.memberCount()).to.equal(2);
    await expect(registry.nameOf(alice.address))
      .to.be.revertedWithCustomError(registry, "NotRegistered");
    // carol đã được swap lên đầu
    const [who0] = await registry.memberAt(0);
    expect(who0).to.equal(carol.address);
  });

  it("8. HOMEWORK extra view: getAllMembers() trả về toàn bộ danh sách", async function () {
    const { registry, alice, bob } = await loadFixture(deployFixture);
    await registry.connect(alice).register("Alice");
    await registry.connect(bob).register("Bob");
    const [addrs, names] = await registry.getAllMembers();
    expect(addrs.length).to.equal(2);
    expect(names[0]).to.equal("Alice");
    expect(names[1]).to.equal("Bob");
    expect(addrs[0]).to.equal(alice.address);
  });

  it("9. queryFilter replay Registered events như frontend (ethers)", async function () {
    const { registry, alice, bob } = await loadFixture(deployFixture);
    await registry.connect(alice).register("Alice");
    await registry.connect(bob).register("Bob");
    const evs = await registry.queryFilter(registry.filters.Registered());
    expect(evs.length).to.equal(2);
    expect(evs[0].args.name).to.equal("Alice");
    expect(evs[1].args.name).to.equal("Bob");
  });
});
