
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CliquePool", function () {
  let CliquePool, pool;
  let owner, user1, user2, user3, attacker;
  const entryAmount = ethers.parseEther("0.1");

  beforeEach(async () => {
    [owner, user1, user2, user3, attacker, ...others] = await ethers.getSigners();
    CliquePool = await ethers.getContractFactory("CliquePool");
    pool = await CliquePool.connect(owner).deploy(entryAmount);
    await pool.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the correct owner and entry amount", async () => {
      expect(await pool.owner()).to.equal(owner.address);
      expect(await pool.entryAmount()).to.equal(entryAmount);
    });

    it("should start with round 1 and active state", async () => {
      expect(await pool.currentRound()).to.equal(1);
      expect(await pool.isRoundActive()).to.equal(true);
    });
  });

  describe("Join Pool", function () {
    it("should allow valid users to join", async () => {
      await pool.connect(user1).joinPool({ value: entryAmount });
      await pool.connect(user2).joinPool({ value: entryAmount });
      const count = await pool.getParticipantCount();
      expect(count).to.equal(2);
    });

    it("should allow user to rejoin after payout", async () => {
      await pool.connect(user1).joinPool({ value: entryAmount });
      await pool.connect(user2).joinPool({ value: entryAmount });
      await pool.connect(owner).triggerPayout();
      await pool.connect(user1).joinPool({ value: entryAmount });
      const count = await pool.getParticipantCount();
      expect(count).to.equal(1);
    });
  });

  describe("Join Restrictions", function () {
    it("should prevent duplicate join", async () => {
      await pool.connect(user1).joinPool({ value: entryAmount });
      await expect(pool.connect(user1).joinPool({ value: entryAmount }))
        .to.be.revertedWith("Already joined this round");
    });

    it("should reject wrong ETH amount", async () => {
      await expect(pool.connect(user3).joinPool({ value: ethers.parseEther("0.05") }))
        .to.be.revertedWith("Incorrect ETH amount");
    });

    it("should reject join beyond max participants", async () => {
      for (let i = 0; i < 10; i++) {
        await pool.connect(others[i]).joinPool({ value: entryAmount });
      }
      await expect(pool.connect(user1).joinPool({ value: entryAmount }))
        .to.be.revertedWith("Round is full");
    });
  });

  describe("Payout", function () {
    it("should allow owner to trigger payout and reset round", async () => {
      await pool.connect(user1).joinPool({ value: entryAmount });
      await pool.connect(user2).joinPool({ value: entryAmount });

      await expect(pool.connect(owner).triggerPayout())
        .to.emit(pool, "PayoutExecuted");

      const countAfter = await pool.getParticipantCount();
      const roundAfter = await pool.currentRound();
      expect(countAfter).to.equal(0);
      expect(roundAfter).to.equal(2);
    });

    it("should prevent non-owner from triggering payout", async () => {
      await pool.connect(user1).joinPool({ value: entryAmount });
      await expect(pool.connect(attacker).triggerPayout())
        .to.be.revertedWith("Only owner can trigger payout");
    });

    it("should revert payout with no participants", async () => {
      const pool2 = await CliquePool.connect(owner).deploy(entryAmount);
      await pool2.waitForDeployment();
      await expect(pool2.connect(owner).triggerPayout())
        .to.be.revertedWith("No participants");
    });
  });

  describe("Fallback", function () {
    it("should revert ETH sent directly", async () => {
      await expect(user1.sendTransaction({ to: pool.target, value: entryAmount }))
        .to.be.revertedWith("Use joinPool()");
    });
  });
});
