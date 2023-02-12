import { ethers } from "hardhat";

const path = require("path");

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Lottery = await ethers.getContractFactory("Lottery");
  const lotteryFactory = await Lottery.deploy();
  await lotteryFactory.deployed();

  console.log("Lottery address:", lotteryFactory.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(lotteryFactory);
}

function saveFrontendFiles(lotteryFactory) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Lottery: lotteryFactory.address }, undefined, 2)
  );

  const LotteryArtifact = artifacts.readArtifactSync("Lottery");

  fs.writeFileSync(
    path.join(contractsDir, "Lottery.json"),
    JSON.stringify(LotteryArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });