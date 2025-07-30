const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying CliquePotFactory...");

  const entryAmount = ethers.parseEther("0.1"); // 0.1 ETH
  const maxParticipants = 10;

  // Deploy the factory
  const Factory = await ethers.getContractFactory("CliquePotFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  console.log("✅ Factory deployed to:", factory.target);

  // Interact: call createPot
  console.log("🚀 Calling createPot on factory...");
  const createTx = await factory.createPot(entryAmount, maxParticipants);
  const receipt = await createTx.wait();

  // Extract PotCreated event
  const potCreatedEvent = receipt.events?.find(e => e.event === "PotCreated");
  const potAddress = potCreatedEvent?.args?.potAddress;

  console.log("✅ PotCreated event:");
  console.log("   Pot address:     ", potAddress);
  console.log("   Creator:         ", potCreatedEvent.args.creator);
  console.log("   Entry amount:    ", ethers.formatEther(potCreatedEvent.args.entryAmount));
  console.log("   Max participants:", potCreatedEvent.args.maxParticipants.toString());

  console.log("📦 Deployed pot via factory successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
