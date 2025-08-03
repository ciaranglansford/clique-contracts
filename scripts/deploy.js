const { ethers } = require("hardhat");

// Utility: Extract a specific event from a transaction receipt
function getEventFromReceipt(receipt, iface, eventName) {
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === eventName) return parsed;
    } catch (_) {
      // Skip logs that don't match this contract's ABI
      continue;
    }
  }
  throw new Error(`${eventName} not found in logs`);
}

async function main() {
  console.log("🚀 Deploying CliquePotFactory...");

  const entryAmount = ethers.parseEther("0.1"); // 0.1 ETH
  const maxParticipants = 10;

  // Step 1: Deploy the factory contract
  const Factory = await ethers.getContractFactory("CliquePotFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  console.log("✅ Factory deployed to:", factory.target);

  // Step 2: Call createPot() on the factory
  console.log("🚀 Calling createPot on factory...");
  const createTx = await factory.createPot(entryAmount, maxParticipants);
  const receipt = await createTx.wait();

  // Step 3: Use ABI interface to extract PotCreated event from logs
  const potCreatedEvent = getEventFromReceipt(receipt, Factory.interface, "PotCreated");

  // Step 4: Destructure and log event details
  const {
    potAddress,
    creator,
    entryAmount: entry,
    maxParticipants: max
  } = potCreatedEvent.args;

  console.log("✅ PotCreated event:");
  console.log("   Pot address:     ", potAddress);
  console.log("   Creator:         ", creator);
  console.log("   Entry amount:    ", ethers.formatEther(entry));
  console.log("   Max participants:", max.toString());

  console.log("📦 Deployed pot via factory successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
