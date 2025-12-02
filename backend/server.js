const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const winston = require('winston');
require('dotenv').config();

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

// In-memory storage for demo
let pumpStatus = { pump1: 'off', pump2: 'off' };
let paymentLogs = [];
let reasoningLogs = [];
let notifications = [];

// Tools system
const tools = {
  async controlPump(pumpId, action, duration = 30) {
    logger.info(`Controlling pump ${pumpId}: ${action} for ${duration}min`);
    pumpStatus[pumpId] = action;
    
    // Auto-stop pump after duration
    if (action === 'on') {
      setTimeout(() => {
        pumpStatus[pumpId] = 'off';
        logger.info(`Pump ${pumpId} auto-stopped after ${duration} minutes`);
      }, duration * 60 * 1000);
    }
    
    return { success: true, pump: pumpId, status: action, duration };
  },

  async validatePayment(paymentData) {
    logger.info(`Validating payment ${paymentData.paymentId}`);
    
    // Payment validation logic
    const isValid = paymentData.amount >= 25 && paymentData.customer;
    const pumpTime = Math.floor(paymentData.amount / 25) * 30; // 30min per $25
    
    return { 
      valid: isValid, 
      amount: paymentData.amount, 
      customer: paymentData.customer,
      pumpDuration: pumpTime
    };
  },

  async sendNotification(message, type = 'info') {
    logger.info(`Notification [${type}]: ${message}`);
    notifications.push({
      timestamp: new Date().toISOString(),
      message,
      type
    });
    return { sent: true, message, type };
  },

  async logActivity(activity) {
    logger.info(`Activity: ${activity}`);
    return { logged: true, activity };
  }
};

// LLM reasoning function
async function processWithLLM(task) {
  try {
    const prompt = `You are FlowFli, an AI agent managing water pumps based on payments.

Task: ${JSON.stringify(task)}
Current pump status: ${JSON.stringify(pumpStatus)}

Rules:
- Minimum $25 payment required
- Each $25 = 30 minutes pump time
- Maximum 4 hours per session
- Only activate if payment is valid

Analyze and respond with JSON:
{
  "reasoning": "your analysis of the payment/task",
  "actions": [
    {"tool": "validatePayment", "params": {"paymentData": {...}}},
    {"tool": "controlPump", "params": {"pumpId": "pump1", "action": "on", "duration": 30}},
    {"tool": "sendNotification", "params": {"message": "Pump activated for customer", "type": "success"}}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Log reasoning
    reasoningLogs.push({
      timestamp: new Date().toISOString(),
      task,
      reasoning: result.reasoning,
      actions: result.actions
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

// Payment processing endpoint (replaces n8n)
app.post('/payment', async (req, res) => {
  try {
    logger.info('Payment received:', req.body);
    
    const paymentData = {
      paymentId: req.body.paymentId,
      amount: req.body.amount,
      customer: req.body.customer,
      timestamp: new Date().toISOString(),
      ...req.body
    };
    
    // Process payment with AI
    const task = { type: 'payment', data: paymentData };
    const decision = await processWithLLM(task);
    const results = await executeActions(decision.actions);
    
    // Log payment
    paymentLogs.push({
      ...paymentData,
      processed: true,
      aiDecision: decision.reasoning,
      results
    });
    
    res.json({
      success: true,
      paymentId: paymentData.paymentId,
      reasoning: decision.reasoning,
      actions: results
    });
    
  } catch (error) {
    logger.error('Payment processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ATP webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    logger.info('ATP webhook received:', req.body);
    
    const task = req.body;
    
    // Process with LLM
    const decision = await processWithLLM(task);
    
    // Execute actions
    const results = await executeActions(decision.actions);
    
    res.json({
      success: true,
      reasoning: decision.reasoning,
      actions: results
    });
    
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
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

// Status endpoints
app.get('/status', (req, res) => {
  res.json({
    pumps: pumpStatus,
    payments: paymentLogs.length,
    reasoning: reasoningLogs.length,
    notifications: notifications.length
  });
});

app.get('/logs/payments', (req, res) => {
  res.json(paymentLogs.slice(-50));
});

app.get('/logs/reasoning', (req, res) => {
  res.json(reasoningLogs.slice(-50));
});

app.get('/logs/notifications', (req, res) => {
  res.json(notifications.slice(-50));
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

app.listen(PORT, () => {
  logger.info(`FlowFli backend running on port ${PORT}`);
});
