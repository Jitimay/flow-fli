const { Web3 } = require('web3');
const logger = require('winston');

class ContractManager {
  constructor() {
    // Only initialize blockchain if enabled and configured
    if (process.env.BLOCKCHAIN_ENABLED === 'true' && process.env.AGENT_PRIVATE_KEY) {
      this.web3 = new Web3(process.env.RPC_URL || 'http://localhost:8545');
      this.waterCreditAddress = process.env.WATER_CREDIT_CONTRACT;
      this.agentControllerAddress = process.env.AGENT_CONTROLLER_CONTRACT;
      this.privateKey = process.env.AGENT_PRIVATE_KEY;
      
      this.account = this.web3.eth.accounts.privateKeyToAccount(this.privateKey);
      this.web3.eth.accounts.wallet.add(this.account);
      this.enabled = true;
    } else {
      this.enabled = false;
      logger.info('Blockchain disabled - running in mock mode');
    }
  }

  async purchaseWaterCredits(userAddress, amount) {
    if (!this.enabled) {
      return { success: false, message: 'Blockchain disabled' };
    }
    
    try {
      const waterCredit = new this.web3.eth.Contract(
        require('../contracts/WaterCredit.json').abi,
        this.waterCreditAddress
      );

      const tx = await waterCredit.methods.purchaseWater().send({
        from: userAddress,
        value: this.web3.utils.toWei(amount.toString(), 'ether'),
        gas: 200000
      });

      logger.info(`Water credits purchased: ${tx.transactionHash}`);
      return tx;
    } catch (error) {
      logger.error(`Contract purchase error: ${error.message}`);
      throw error;
    }
  }

  async activatePumpOnChain(userAddress, duration) {
    try {
      const agentController = new this.web3.eth.Contract(
        require('../contracts/AgentController.json').abi,
        this.agentControllerAddress
      );

      const tx = await agentController.methods.activatePump(userAddress, duration).send({
        from: this.account.address,
        gas: 150000
      });

      logger.info(`Pump activated on-chain: ${tx.transactionHash}`);
      return tx;
    } catch (error) {
      logger.error(`Contract activation error: ${error.message}`);
      throw error;
    }
  }

  async getWaterBalance(userAddress) {
    try {
      const waterCredit = new this.web3.eth.Contract(
        require('../contracts/WaterCredit.json').abi,
        this.waterCreditAddress
      );

      const balance = await waterCredit.methods.getWaterBalance(userAddress).call();
      return parseInt(balance);
    } catch (error) {
      logger.error(`Balance check error: ${error.message}`);
      return 0;
    }
  }

  async registerAgent() {
    try {
      const agentController = new this.web3.eth.Contract(
        require('../contracts/AgentController.json').abi,
        this.agentControllerAddress
      );

      const tx = await agentController.methods.registerAgent(this.account.address).send({
        from: this.account.address,
        gas: 100000
      });

      logger.info(`Agent registered on-chain: ${tx.transactionHash}`);
      return tx;
    } catch (error) {
      logger.error(`Agent registration error: ${error.message}`);
      throw error;
    }
  }

  async listenToEvents() {
    try {
      const waterCredit = new this.web3.eth.Contract(
        require('../contracts/WaterCredit.json').abi,
        this.waterCreditAddress
      );

      waterCredit.events.WaterPurchased()
        .on('data', (event) => {
          logger.info(`Water purchased event: ${JSON.stringify(event.returnValues)}`);
          this.handleWaterPurchase(event.returnValues);
        })
        .on('error', (error) => {
          logger.error(`Event listening error: ${error.message}`);
        });

    } catch (error) {
      logger.error(`Event setup error: ${error.message}`);
    }
  }

  async handleWaterPurchase(eventData) {
    // Process the water purchase event
    // This could trigger pump activation or other actions
    logger.info(`Processing water purchase for user: ${eventData.user}`);
  }
}

module.exports = new ContractManager();
