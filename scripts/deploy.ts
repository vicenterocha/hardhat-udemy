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

  const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
  const campaignFactory = await CampaignFactory.deploy();
  await campaignFactory.deployed();

  console.log("CampaignFactory address:", campaignFactory.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(campaignFactory);
}

function saveFrontendFiles(campaignFactory) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ CampaignFactory: campaignFactory.address }, undefined, 2)
  );

  const CampaignFactoryArtifact = artifacts.readArtifactSync("CampaignFactory");

  fs.writeFileSync(
    path.join(contractsDir, "CampaignFactory.json"),
    JSON.stringify(CampaignFactoryArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });