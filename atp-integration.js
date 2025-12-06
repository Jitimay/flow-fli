// FlowFli ATP Integration (Optional Enhancement)
const { createATPPlugin } = require('@iqai/plugin-atp');

class FlowFliATP {
  constructor() {
    this.atp = null;
    this.agentTicker = "FLI";
  }

  async initialize() {
    if (process.env.ATP_ENABLED === 'true' && process.env.PRIVATE_KEY) {
      this.atp = await createATPPlugin({
        walletPrivateKey: process.env.PRIVATE_KEY,
      });
    }
  }

  async logToATP(event, data) {
    if (!this.atp) return;
    
    try {
      await this.atp.ATP_LOG_EVENT({
        ticker: this.agentTicker,
        event,
        data
      });
    } catch (error) {
      console.log('ATP logging failed:', error.message);
    }
  }

  async getAgentStats() {
    if (!this.atp) return null;
    
    try {
      return await this.atp.ATP_GET_AGENT_STATS({
        ticker: this.agentTicker,
      });
    } catch (error) {
      console.log('ATP stats failed:', error.message);
      return null;
    }
  }
}

module.exports = new FlowFliATP();
