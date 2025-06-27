const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying CliquePool...");

  // Get the contract factory (like a deploy blueprint)
  const CliquePool = await hre.ethers.getContractFactory("CliquePool");

  // Deploy the contract
  const pool = await CliquePool.deploy();

  // Wait for deployment to be mined
  await pool.waitForDeployment();

  console.log(`✅ Deployed CliquePool to: ${pool.target}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});