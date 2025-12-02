const axios = require('axios');
const logger = require('winston');

class ATPIntegration {
  constructor() {
    this.agentId = process.env.ATP_AGENT_ID;
    this.apiKey = process.env.ATP_API_KEY;
    this.baseURL = 'https://api.iq.wiki/atp';
    this.agentMetadata = {
      name: 'FlowFli Water Management Agent',
      description: 'AI-powered autonomous water pump control and payment processing system',
      version: '1.0.0',
      capabilities: [
        'payment-processing',
        'pump-control', 
        'sensor-monitoring',
        'fraud-detection',
        'autonomous-decisions'
      ],
      tags: ['water', 'iot', 'ai', 'payments', 'automation']
    };
  }

  async registerForATP() {
    try {
      const registrationData = {
        ...this.agentMetadata,
        webhookUrl: `${process.env.BASE_URL}/atp/webhook`,
        healthCheckUrl: `${process.env.BASE_URL}/health`,
        logoUrl: `${process.env.BASE_URL}/logo.png`,
        documentation: {
          readme: 'https://github.com/Jitimay/flow-fli/blob/main/README.md',
          api: `${process.env.BASE_URL}/api/docs`
        }
      };

      logger.info('Preparing agent for ATP registration:', registrationData);
      return registrationData;
    } catch (error) {
      logger.error(`ATP registration preparation error: ${error.message}`);
      throw error;
    }
  }

  async handleATPWebhook(webhookData) {
    try {
      logger.info('ATP webhook received:', webhookData);
      
      const { type, payload } = webhookData;
      
      switch (type) {
        case 'payment_received':
          return await this.processPayment(payload);
        case 'agent_query':
          return await this.handleQuery(payload);
        case 'health_check':
          return await this.healthCheck();
        case 'capability_request':
          return await this.getCapabilities();
        default:
          logger.warn(`Unknown ATP webhook type: ${type}`);
          return { success: false, error: 'Unknown webhook type' };
      }
    } catch (error) {
      logger.error(`ATP webhook error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async processPayment(paymentData) {
    // Process payment through existing FlowFli system
    const pumpController = require('../hardware/pumpController');
    const fraudDetection = require('../security/fraudDetection');
    
    // Fraud check
    const fraudAnalysis = await fraudDetection.analyzePayment(paymentData);
    if (fraudAnalysis.shouldBlock) {
      return {
        success: false,
        error: 'Payment blocked by fraud detection',
        riskScore: fraudAnalysis.riskScore
      };
    }
    
    // Calculate pump time
    const pumpDuration = Math.floor(paymentData.amount / 25) * 30; // 30min per $25
    
    if (pumpDuration > 0) {
      await pumpController.controlPump('pump1', 'on', pumpDuration);
      
      return {
        success: true,
        action: 'pump_activated',
        duration: pumpDuration,
        message: `Pump activated for ${pumpDuration} minutes`
      };
    }
    
    return {
      success: false,
      error: 'Insufficient payment amount',
      minimum: 25
    };
  }

  async handleQuery(queryData) {
    const sensors = require('../hardware/sensors');
    const pumpController = require('../hardware/pumpController');
    
    const { query } = queryData;
    
    if (query.includes('status')) {
      return {
        success: true,
        data: {
          pumps: pumpController.getStatus(),
          sensors: sensors.getSensorData(),
          timestamp: new Date().toISOString()
        }
      };
    }
    
    if (query.includes('health')) {
      return await this.healthCheck();
    }
    
    return {
      success: true,
      message: 'FlowFli agent is operational',
      capabilities: this.agentMetadata.capabilities
    };
  }

  async healthCheck() {
    const sensors = require('../hardware/sensors');
    const alerts = sensors.getAlerts();
    
    return {
      success: true,
      status: 'healthy',
      uptime: process.uptime(),
      alerts: alerts.length,
      timestamp: new Date().toISOString()
    };
  }

  async getCapabilities() {
    return {
      success: true,
      capabilities: this.agentMetadata.capabilities,
      description: this.agentMetadata.description,
      version: this.agentMetadata.version
    };
  }

  getATPLaunchConfig() {
    return {
      agentMetadata: this.agentMetadata,
      deploymentInfo: {
        webhookUrl: `${process.env.BASE_URL}/atp/webhook`,
        healthCheckUrl: `${process.env.BASE_URL}/health`,
        documentation: `${process.env.BASE_URL}/docs`,
        repository: 'https://github.com/Jitimay/flow-fli'
      },
      requirements: {
        iqTokens: 'Will be provided via airdrop after hackathon',
        network: 'IQ mainnet',
        fees: 'Covered by IQAI for hackathon participants'
      }
    };
  }
}

module.exports = new ATPIntegration();
