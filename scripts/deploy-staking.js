const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);

  // 1. Deploy Clique Token (1,000,000 RWT)
  const CliqueToken = await ethers.getContractFactory("Clique");
  const cliqueToken = await CliqueToken.deploy(ethers.parseUnits("1000000", 18));
  await cliqueToken.waitForDeployment();
  console.log(`✅ CliqueToken deployed at: ${await cliqueToken.getAddress()}`);

  // 2. Deploy MasterChef
  const rewardPerSec = ethers.parseUnits("1", 18); // 1 CLQ per second
  const currentTime = Math.floor(Date.now() / 1000); // current Unix timestamp

  const MasterChef = await ethers.getContractFactory("MasterChef");
  const masterChef = await MasterChef.deploy(
    await cliqueToken.getAddress(),
    rewardPerSec,
    currentTime
  );
  await masterChef.waitForDeployment();
  console.log(`✅ MasterChef deployed at: ${await masterChef.getAddress()}`);

  // 3. Transfer 500,000 RWT to MasterChef contract
  const fundingAmount = ethers.parseUnits("500000", 18);
  const transferTx = await cliqueToken.transfer(await masterChef.getAddress(), fundingAmount);
  await transferTx.wait();
  console.log(`✅ Transferred ${ethers.formatUnits(fundingAmount, 18)} RWT to MasterChef`);

  // 4. Add staking pool to MasterChef (allocPoint = 100)
  const addTx = await masterChef.addPool(
    100,                                 // allocPoint
    ethers.ZeroAddress,     // empty for eth pool
    true,                                 // withUpdate
    true                              // eth pool
  );
  await addTx.wait();
  console.log(`✅ Pool added for staking token: ETH with allocPoint 100`);

  console.log("\n🚀 Deployment complete. Ready for local testing.");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});