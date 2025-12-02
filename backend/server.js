const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const winston = require('winston');
require('dotenv').config();

// Import new modules
const db = require('./database/connection');
const pumpController = require('./hardware/pumpController');
const sensors = require('./hardware/sensors');
const eventLogger = require('./analytics/eventLogger');
const atpIntegration = require('./atp/atpIntegration');
const contractManager = require('./blockchain/contractManager');
const fraudDetection = require('./security/fraudDetection');
const governanceSystem = require('./governance/governanceSystem');

const app = express();
const PORT = process.env.PORT || 3001;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'flowfli.log' })
  ]
});

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced tools system
const tools = {
  async controlPump(pumpId, action, duration = 30) {
    const result = await pumpController.controlPump(pumpId, action, duration);
    await eventLogger.logPumpAction(pumpId, action, duration);
    return result;
  },

  async validatePayment(paymentData) {
    logger.info(`Validating payment ${paymentData.paymentId}`);
    
    const isValid = paymentData.amount >= 25 && paymentData.customer;
    const pumpTime = Math.floor(paymentData.amount / 25) * 30;
    
    // Log to database
    await eventLogger.logPayment({
      ...paymentData,
      processed: isValid,
      aiDecision: isValid ? 'Payment approved' : 'Payment rejected - insufficient amount'
    });
    
    return { 
      valid: isValid, 
      amount: paymentData.amount, 
      customer: paymentData.customer,
      pumpDuration: pumpTime
    };
  },

  async getSensorData() {
    const data = sensors.getSensorData();
    await eventLogger.logEvent('sensor_reading', data);
    return data;
  },

  async sendNotification(message, type = 'info') {
    logger.info(`Notification [${type}]: ${message}`);
    await eventLogger.logEvent('notification', { message, type });
    return { sent: true, message, type };
  },

  async checkBlockchainBalance(userAddress) {
    if (process.env.BLOCKCHAIN_ENABLED === 'true') {
      return await contractManager.getWaterBalance(userAddress);
    }
    return { balance: 0, blockchain: false };
  }
};

// Enhanced LLM reasoning with fraud and governance context
async function processWithLLM(task) {
  try {
    const sensorData = sensors.getSensorData();
    const pumpStatus = pumpController.getStatus();
    const governanceParams = governanceSystem.getSystemParameters();
    
    const prompt = `You are FlowFli, an AI agent managing water pumps with advanced security and governance.

Task: ${JSON.stringify(task)}
Current pump status: ${JSON.stringify(pumpStatus)}
Sensor data: ${JSON.stringify(sensorData)}
Governance parameters: ${JSON.stringify(governanceParams)}
${task.fraudAnalysis ? `Fraud analysis: ${JSON.stringify(task.fraudAnalysis)}` : ''}

Rules:
- Minimum payment: $${governanceParams.minPaymentAmount}
- Each $25 = 30 minutes pump time
- Maximum duration: ${governanceParams.maxPumpDuration} minutes
- Fraud threshold: ${governanceParams.fraudThreshold}%
- Emergency mode: ${governanceSystem.isEmergencyMode()}
- Check sensor alerts before activation
- Consider fraud risk in decisions

Analyze and respond with JSON:
{
  "reasoning": "your analysis including security and governance considerations",
  "actions": [
    {"tool": "validatePayment", "params": {"paymentData": {...}}},
    {"tool": "controlPump", "params": {"pumpId": "pump1", "action": "on", "duration": 30}},
    {"tool": "sendNotification", "params": {"message": "Pump activated", "type": "success"}}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Enhanced logging with security context
    await eventLogger.logEvent('ai_reasoning', {
      task,
      reasoning: result.reasoning,
      actions: result.actions,
      sensorData,
      pumpStatus,
      governanceParams,
      fraudContext: task.fraudAnalysis || null
    });

    return result;
  } catch (error) {
    logger.error('LLM processing error:', error);
    throw error;
  }
}

// Execute actions
async function executeActions(actions) {
  const results = [];
  
  for (const action of actions) {
    try {
      const tool = tools[action.tool];
      if (tool) {
        const result = await tool(...Object.values(action.params));
        results.push({ action: action.tool, result, success: true });
      } else {
        results.push({ action: action.tool, error: 'Tool not found', success: false });
      }
    } catch (error) {
      logger.error(`Action execution error:`, error);
      results.push({ action: action.tool, error: error.message, success: false });
    }
  }
  
  return results;
}

// Enhanced payment processing with fraud detection
app.post('/payment', async (req, res) => {
  try {
    logger.info('Payment received:', req.body);
    
    const paymentData = {
      paymentId: req.body.paymentId,
      amount: req.body.amount,
      customer: req.body.customer,
      userAddress: req.body.userAddress,
      timestamp: new Date().toISOString(),
      ...req.body
    };
    
    // Check governance emergency mode
    if (governanceSystem.isEmergencyMode()) {
      throw new Error('System in emergency mode - payments suspended');
    }
    
    // Fraud detection analysis
    const fraudAnalysis = await fraudDetection.analyzePayment(paymentData);
    if (fraudAnalysis.shouldBlock) {
      return res.status(403).json({
        success: false,
        error: 'Payment blocked by fraud detection',
        risks: fraudAnalysis.risks,
        riskScore: fraudAnalysis.riskScore
      });
    }
    
    // Check sensor alerts first
    const alerts = sensors.getAlerts();
    if (alerts.some(alert => alert.type === 'critical')) {
      throw new Error('Critical sensor alert - pump activation blocked');
    }
    
    // Process payment with AI (enhanced with fraud context)
    const task = { 
      type: 'payment', 
      data: paymentData,
      fraudAnalysis: fraudAnalysis
    };
    const decision = await processWithLLM(task);
    const results = await executeActions(decision.actions);
    
    // Blockchain integration (if enabled)
    if (process.env.BLOCKCHAIN_ENABLED === 'true' && paymentData.userAddress) {
      try {
        await contractManager.activatePumpOnChain(paymentData.userAddress, 30);
      } catch (blockchainError) {
        logger.warn(`Blockchain activation failed: ${blockchainError.message}`);
      }
    }
    
    res.json({
      success: true,
      paymentId: paymentData.paymentId,
      reasoning: decision.reasoning,
      actions: results,
      alerts: alerts,
      fraudAnalysis: {
        riskScore: fraudAnalysis.riskScore,
        recommendation: fraudAnalysis.recommendation
      }
    });
    
  } catch (error) {
    logger.error('Payment processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ATP webhook endpoint (IQAI integration)
app.post('/atp/webhook', async (req, res) => {
  try {
    logger.info('ATP webhook received:', req.body);
    
    const result = await atpIntegration.handleATPWebhook(req.body);
    res.json(result);
    
  } catch (error) {
    logger.error('ATP webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ATP registration info endpoint
app.get('/atp/config', async (req, res) => {
  try {
    const config = atpIntegration.getATPLaunchConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check for ATP
app.get('/health', async (req, res) => {
  const health = await atpIntegration.healthCheck();
  res.json(health);
});

// Manual execution endpoint
app.post('/execute', async (req, res) => {
  try {
    const { command, params } = req.body;
    
    const task = { type: 'manual', command, params };
    const decision = await processWithLLM(task);
    const results = await executeActions(decision.actions);
    
    res.json({
      success: true,
      reasoning: decision.reasoning,
      actions: results
    });
    
  } catch (error) {
    logger.error('Execute error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced status endpoints
app.get('/status', async (req, res) => {
  const sensorData = sensors.getSensorData();
  const pumpStatus = pumpController.getStatus();
  const alerts = sensors.getAlerts();
  
  res.json({
    pumps: pumpStatus,
    sensors: sensorData,
    alerts: alerts,
    payments: await eventLogger.getPayments(1).then(p => p.length),
    events: await eventLogger.getEvents(1).then(e => e.length),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/logs/payments', async (req, res) => {
  const payments = await eventLogger.getPayments(50);
  res.json(payments);
});

app.get('/logs/events', async (req, res) => {
  const events = await eventLogger.getEvents(100);
  res.json(events);
});

app.get('/logs/analytics/:metric', async (req, res) => {
  const analytics = await eventLogger.getAnalytics(req.params.metric, 24);
  res.json(analytics);
});

app.get('/sensors', (req, res) => {
  res.json(sensors.getSensorData());
});

app.get('/alerts', (req, res) => {
  res.json(sensors.getAlerts());
});

// Governance endpoints
app.post('/governance/proposal', async (req, res) => {
  try {
    const proposal = await governanceSystem.createProposal(req.body);
    res.json({ success: true, proposal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/governance/vote', async (req, res) => {
  try {
    const { proposalId, voter, support, votingPower } = req.body;
    const result = await governanceSystem.vote(proposalId, voter, support, votingPower);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/governance/emergency-stop', async (req, res) => {
  try {
    const { adminAddress, reason } = req.body;
    const result = await governanceSystem.emergencyStop(adminAddress, reason);
    res.json(result);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.get('/governance/stats', async (req, res) => {
  const stats = await governanceSystem.getGovernanceStats();
  res.json(stats);
});

app.get('/governance/proposals', async (req, res) => {
  const proposals = await governanceSystem.getActiveProposals();
  res.json(proposals);
});

// Security endpoints
app.get('/security/report', async (req, res) => {
  const report = await fraudDetection.getSecurityReport();
  res.json(report);
});

app.get('/security/parameters', (req, res) => {
  const parameters = governanceSystem.getSystemParameters();
  res.json(parameters);
});

// Simulate payment endpoint for testing
app.post('/simulate-payment', async (req, res) => {
  try {
    const testPayment = {
      paymentId: `test_${Date.now()}`,
      amount: req.body.amount || 50,
      customer: req.body.customer || 'test_user',
      method: 'test'
    };
    
    // Forward to payment processor
    const response = await axios.post(`http://localhost:${PORT}/payment`, testPayment);
    res.json(response.data);
    
  } catch (error) {
    logger.error('Payment simulation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database
    logger.info('Initializing database...');
    
    // Start ATP integration
    if (process.env.ATP_ENABLED === 'true') {
      logger.info('Preparing ATP integration...');
      const atpConfig = await atpIntegration.registerForATP();
      logger.info('ATP registration config ready:', atpConfig);
    }
    
    // Initialize blockchain
    if (process.env.BLOCKCHAIN_ENABLED === 'true') {
      logger.info('Initializing blockchain...');
      await contractManager.registerAgent();
      contractManager.listenToEvents();
    }
    
    // Set hardware to mock mode by default
    process.env.MOCK_HARDWARE = process.env.MOCK_HARDWARE || 'true';
    
    app.listen(PORT, () => {
      logger.info(`FlowFli backend running on port ${PORT}`);
      logger.info(`Mock hardware mode: ${process.env.MOCK_HARDWARE}`);
      logger.info(`ATP enabled: ${process.env.ATP_ENABLED || 'false'}`);
      logger.info(`Blockchain enabled: ${process.env.BLOCKCHAIN_ENABLED || 'false'}`);
    });
    
  } catch (error) {
    logger.error(`Server startup error: ${error.message}`);
    process.exit(1);
  }
}

startServer();
