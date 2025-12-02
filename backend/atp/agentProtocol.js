const axios = require('axios');
const logger = require('winston');

class ATPAgent {
  constructor() {
    this.agentId = process.env.ATP_AGENT_ID;
    this.capabilities = [
      'payment-processing',
      'pump-control',
      'sensor-monitoring',
      'autonomous-decisions'
    ];
    this.status = 'active';
  }

  async registerAgent() {
    try {
      const registration = {
        agentId: this.agentId,
        name: 'FlowFli Water Management Agent',
        description: 'AI-powered water pump control and payment processing',
        capabilities: this.capabilities,
        webhookUrl: `${process.env.BASE_URL}/webhook`,
        version: '1.0.0',
        metadata: {
          pumpCount: 2,
          sensorTypes: ['flow', 'pressure', 'temperature', 'level'],
          paymentMethods: ['crypto', 'fiat'],
          autonomyLevel: 'high'
        }
      };

      const response = await axios.post(
        `${process.env.ATP_REGISTRY_URL}/agents/register`,
        registration,
        {
          headers: {
            'Authorization': `Bearer ${process.env.ATP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Agent registered successfully with ATP');
      return response.data;
    } catch (error) {
      logger.error(`ATP registration error: ${error.message}`);
      throw error;
    }
  }

  async reportStatus() {
    try {
      const statusReport = {
        agentId: this.agentId,
        status: this.status,
        timestamp: new Date().toISOString(),
        metrics: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          activeConnections: 1
        }
      };

      await axios.post(
        `${process.env.ATP_REGISTRY_URL}/agents/${this.agentId}/status`,
        statusReport,
        {
          headers: {
            'Authorization': `Bearer ${process.env.ATP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Status reported to ATP');
    } catch (error) {
      logger.error(`ATP status report error: ${error.message}`);
    }
  }

  async processATPTask(task) {
    try {
      logger.info(`Processing ATP task: ${task.type}`);
      
      const result = {
        taskId: task.id,
        agentId: this.agentId,
        status: 'completed',
        result: null,
        timestamp: new Date().toISOString()
      };

      switch (task.type) {
        case 'payment-verification':
          result.result = await this.verifyPayment(task.data);
          break;
        case 'pump-control':
          result.result = await this.controlPump(task.data);
          break;
        case 'sensor-reading':
          result.result = await this.getSensorData();
          break;
        default:
          result.status = 'unsupported';
          result.error = `Task type ${task.type} not supported`;
      }

      return result;
    } catch (error) {
      logger.error(`ATP task processing error: ${error.message}`);
      return {
        taskId: task.id,
        agentId: this.agentId,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  startStatusReporting() {
    // Report status every 5 minutes
    setInterval(() => {
      this.reportStatus();
    }, 5 * 60 * 1000);
  }
}

module.exports = new ATPAgent();
