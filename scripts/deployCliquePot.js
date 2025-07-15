const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying CliquePot...");

  const entryAmount = ethers.parseEther("0.1"); // converts 0.1 ETH to wei
  const max_participants = 10;

  const CliquePot = await ethers.getContractFactory("CliquePot");
  const contract = await CliquePot.deploy(entryAmount, max_participants);
  await contract.waitForDeployment();

  console.log("✅ Contract deployed to:", contract.target);
  console.log("Entry amount:", entryAmount, " max_participants " , max_participants);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});