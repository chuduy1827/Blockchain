const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ClassToken", function () {
  const MAX_SUPPLY = ethers.parseUnits("1000000", 18);

  async function fixture() {
    const [deployer, recipient, spender] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("ClassToken");
    const token = await Token.deploy(deployer.address);
    await token.waitForDeployment();
    return { token, deployer, recipient, spender };
  }

  it("has correct name/symbol/decimals and mints full cap to deployer", async function () {
    const { token, deployer } = await fixture();

    expect(await token.name()).to.equal("ClassToken");
    expect(await token.symbol()).to.equal("CTK");
    expect(await token.decimals()).to.equal(18);
    expect(await token.cap()).to.equal(MAX_SUPPLY);
    expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
    expect(await token.balanceOf(deployer.address)).to.equal(MAX_SUPPLY);
  });

  it("transfer moves balances and emits Transfer", async function () {
    const { token, deployer, recipient } = await fixture();
    const amount = ethers.parseUnits("250", 18);

    await expect(token.connect(deployer).transfer(recipient.address, amount))
      .to.emit(token, "Transfer")
      .withArgs(deployer.address, recipient.address, amount);

    expect(await token.balanceOf(recipient.address)).to.equal(amount);
    expect(await token.balanceOf(deployer.address)).to.equal(MAX_SUPPLY - amount);
  });

  it("reverts on insufficient balance with ERC20InsufficientBalance", async function () {
    const { token, recipient, spender } = await fixture();

    await expect(
      token.connect(recipient).transfer(spender.address, ethers.parseUnits("1", 18))
    )
      .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
      .withArgs(recipient.address, 0, ethers.parseUnits("1", 18));
  });

  it("approve + transferFrom updates allowance and balances", async function () {
    const { token, deployer, recipient, spender } = await fixture();
    const amount = ethers.parseUnits("77", 18);

    await expect(token.connect(deployer).approve(spender.address, amount))
      .to.emit(token, "Approval")
      .withArgs(deployer.address, spender.address, amount);

    expect(await token.allowance(deployer.address, spender.address)).to.equal(amount);

    await expect(
      token.connect(spender).transferFrom(deployer.address, recipient.address, amount)
    )
      .to.emit(token, "Transfer")
      .withArgs(deployer.address, recipient.address, amount);

    expect(await token.allowance(deployer.address, spender.address)).to.equal(0);
    expect(await token.balanceOf(recipient.address)).to.equal(amount);
  });

  it("conserves supply over a sequence of transfers", async function () {
    const { token, deployer, recipient } = await fixture();

    const amounts = [
      ethers.parseUnits("1", 18),
      ethers.parseUnits("10", 18),
      ethers.parseUnits("100", 18),
      ethers.parseUnits("999", 18),
    ];

    let running = 0n;
    for (const amount of amounts) {
      await token.connect(deployer).transfer(recipient.address, amount);
      running += amount;
      expect(await token.balanceOf(recipient.address)).to.equal(running);
      expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
    }
  });

  it("enforces the cap even though full supply is already minted", async function () {
    const { token } = await fixture();
    expect(await token.cap()).to.equal(await token.totalSupply());
  });

  describe("EIP-2612 permit (BONUS)", function () {
    it("sets allowance via off-chain signature and bumps nonce", async function () {
      const { token, deployer, spender } = await fixture();
      const value = ethers.parseUnits("42", 18);
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const { chainId } = await ethers.provider.getNetwork();
      const domain = {
        name: "ClassToken",
        version: "1",
        chainId,
        verifyingContract: await token.getAddress(),
      };
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const nonce = await token.nonces(deployer.address);
      const sig = await deployer.signTypedData(domain, types, {
        owner: deployer.address,
        spender: spender.address,
        value,
        nonce,
        deadline,
      });
      const { v, r, s } = ethers.Signature.from(sig);

      const relayer = spender;
      await expect(
        token.connect(relayer).permit(deployer.address, spender.address, value, deadline, v, r, s)
      )
        .to.emit(token, "Approval")
        .withArgs(deployer.address, spender.address, value);

      expect(await token.allowance(deployer.address, spender.address)).to.equal(value);
      expect(await token.nonces(deployer.address)).to.equal(nonce + 1n);
    });

    it("reverts on expired deadline", async function () {
      const { token, deployer, spender } = await fixture();
      const value = ethers.parseUnits("1", 18);
      const { chainId } = await ethers.provider.getNetwork();
      const domain = {
        name: "ClassToken",
        version: "1",
        chainId,
        verifyingContract: await token.getAddress(),
      };
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const nonce = await token.nonces(deployer.address);
      const deadline = Math.floor(Date.now() / 1000) - 10;
      const sig = await deployer.signTypedData(domain, types, {
        owner: deployer.address,
        spender: spender.address,
        value,
        nonce,
        deadline,
      });
      const { v, r, s } = ethers.Signature.from(sig);

      await expect(
        token.permit(deployer.address, spender.address, value, deadline, v, r, s)
      ).to.be.revertedWithCustomError(token, "ERC2612ExpiredSignature");
    });

    it("reuses of the same permit are rejected (nonce binding)", async function () {
      const { token, deployer, spender } = await fixture();
      const value = ethers.parseUnits("5", 18);
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const { chainId } = await ethers.provider.getNetwork();
      const domain = {
        name: "ClassToken",
        version: "1",
        chainId,
        verifyingContract: await token.getAddress(),
      };
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };
      const nonce = await token.nonces(deployer.address);
      const sig = await deployer.signTypedData(domain, types, {
        owner: deployer.address,
        spender: spender.address,
        value,
        nonce,
        deadline,
      });
      const { v, r, s } = ethers.Signature.from(sig);

      await token.permit(deployer.address, spender.address, value, deadline, v, r, s);
      await expect(
        token.permit(deployer.address, spender.address, value, deadline, v, r, s)
      ).to.be.revertedWithCustomError(token, "ERC2612InvalidSigner");
    });
  });
});
