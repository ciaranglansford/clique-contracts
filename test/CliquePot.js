
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CliquePot", function () {
  let CliquePot, pot;
  let owner, user1, user2, user3, attacker;
  const entryAmount = ethers.parseEther("0.1");

  beforeEach(async () => {
    [owner, user1, user2, user3, attacker, ...others] = await ethers.getSigners();
    CliquePot = await ethers.getContractFactory("CliquePot");
    pot = await CliquePot.connect(owner).deploy(entryAmount);
    await pot.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the correct owner and entry amount", async () => {
      expect(await pot.owner()).to.equal(owner.address);
      expect(await pot.entryAmount()).to.equal(entryAmount);
    });

    it("should start with round 1 and active state", async () => {
      expect(await pot.currentRound()).to.equal(1);
      expect(await pot.isRoundActive()).to.equal(true);
    });
  });

  describe("Join Pot", function () {
    it("should allow valid users to join", async () => {
      await pot.connect(user1).joinPot({ value: entryAmount });
      await pot.connect(user2).joinPot({ value: entryAmount });
      const count = await pot.getParticipantCount();
      expect(count).to.equal(2);
    });

    it("should allow user to rejoin after payout", async () => {
      await pot.connect(user1).joinPot({ value: entryAmount });
      await pot.connect(user2).joinPot({ value: entryAmount });
      await pot.connect(owner).triggerPayout();
      await pot.connect(user1).joinPot({ value: entryAmount });
      const count = await pot.getParticipantCount();
      expect(count).to.equal(1);
    });
  });

  describe("Join Restrictions", function () {
    it("should prevent duplicate join", async () => {
      await pot.connect(user1).joinPot({ value: entryAmount });
      await expect(pot.connect(user1).joinPot({ value: entryAmount }))
        .to.be.revertedWith("Already joined this round");
    });

    it("should reject wrong ETH amount", async () => {
      await expect(pot.connect(user3).joinPot({ value: ethers.parseEther("0.05") }))
        .to.be.revertedWith("Incorrect ETH amount");
    });

    it("should reject join beyond max participants", async () => {
      for (let i = 0; i < 10; i++) {
        await pot.connect(others[i]).joinPot({ value: entryAmount });
      }
      await expect(pot.connect(user1).joinPot({ value: entryAmount }))
        .to.be.revertedWith("Round is full");
    });
  });

  describe("Payout", function () {
    it("should allow owner to trigger payout and reset round", async () => {
      await pot.connect(user1).joinPot({ value: entryAmount });
      await pot.connect(user2).joinPot({ value: entryAmount });

      await expect(pot.connect(owner).triggerPayout())
        .to.emit(pot, "PayoutExecuted");

      const countAfter = await pot.getParticipantCount();
      const roundAfter = await pot.currentRound();
      expect(countAfter).to.equal(0);
      expect(roundAfter).to.equal(2);
    });

    it("should prevent non-owner from triggering payout", async () => {
      await pot.connect(user1).joinPot({ value: entryAmount });
      await expect(pot.connect(attacker).triggerPayout())
        .to.be.revertedWith("Only owner can trigger payout");
    });

    it("should revert payout with no participants", async () => {
      const pot2 = await CliquePot.connect(owner).deploy(entryAmount);
      await pot2.waitForDeployment();
      await expect(pot2.connect(owner).triggerPayout())
        .to.be.revertedWith("No participants");
    });
  });

  describe("Fallback", function () {
    it("should revert ETH sent directly", async () => {
      await expect(user1.sendTransaction({ to: pot.target, value: entryAmount }))
        .to.be.revertedWith("Use joinPot()");
    });
  });
});
