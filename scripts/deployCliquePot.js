const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying CliquePool...");

  const entryAmount = ethers.parseEther("0.1"); // converts 0.1 ETH to wei

  const CliquePool = await ethers.getContractFactory("CliquePool");
  const contract = await CliquePool.deploy(entryAmount);
  await contract.waitForDeployment();

  console.log("✅ Contract deployed to:", contract.target);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});