const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying FlowFli contracts...');

  // Deploy WaterCredit token
  const WaterCredit = await ethers.getContractFactory('WaterCredit');
  const waterCredit = await WaterCredit.deploy();
  await waterCredit.deployed();
  console.log('WaterCredit deployed to:', waterCredit.address);

  // Deploy AgentController
  const AgentController = await ethers.getContractFactory('AgentController');
  const agentController = await AgentController.deploy(waterCredit.address);
  await agentController.deployed();
  console.log('AgentController deployed to:', agentController.address);

  // Deploy Treasury
  const Treasury = await ethers.getContractFactory('Treasury');
  const treasury = await Treasury.deploy(waterCredit.address);
  await treasury.deployed();
  console.log('Treasury deployed to:', treasury.address);

  // Set up initial configuration
  console.log('Setting up initial configuration...');
  
  // Register the agent controller as authorized
  await waterCredit.setAuthorizedMinter(agentController.address, true);
  console.log('AgentController authorized as minter');

  // Transfer some initial tokens to treasury
  await waterCredit.mint(treasury.address, ethers.utils.parseEther('1000000'));
  console.log('Initial tokens minted to treasury');

  console.log('\n=== Deployment Summary ===');
  console.log('WaterCredit:', waterCredit.address);
  console.log('AgentController:', agentController.address);
  console.log('Treasury:', treasury.address);
  console.log('\nSave these addresses to your .env file:');
  console.log(`WATER_CREDIT_CONTRACT=${waterCredit.address}`);
  console.log(`AGENT_CONTROLLER_CONTRACT=${agentController.address}`);
  console.log(`TREASURY_CONTRACT=${treasury.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
