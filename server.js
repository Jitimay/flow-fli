const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
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
app.use(express.static('public'));

// In-memory storage
let pumpStatus = { pump1: 'off', pump2: 'off' };
let paymentLogs = [];
let reasoningLogs = [];
let notifications = [];

// Mock systems
const mockSensors = {
  getSensorData() {
    return {
      flowRate: { value: Math.random() * 10, unit: 'L/min' },
      pressure: { value: 15 + Math.random() * 5, unit: 'PSI' },
      temperature: { value: 18 + Math.random() * 8, unit: '°C' },
      waterLevel: { value: 80 + Math.random() * 20, unit: '%' },
      timestamp: new Date().toISOString(),
      mockMode: true
    };
  },
  getAlerts() { return []; }
};

const mockPumpController = {
  controlPump(pumpId, action, duration = 30) {
    logger.info(`[MOCK] Pump ${pumpId} ${action} for ${duration}min`);
    pumpStatus[pumpId] = action;
    
    if (action === 'on') {
      setTimeout(() => {
        pumpStatus[pumpId] = 'off';
        logger.info(`[MOCK] Pump ${pumpId} auto-stopped`);
      }, duration * 60 * 1000);
    }
    
    return { success: true, pump: pumpId, status: action, duration };
  },
  getStatus() { return pumpStatus; }
};

const mockFraudDetection = {
  async analyzePayment(paymentData) {
    const riskScore = paymentData.amount < 25 ? 80 : 20;
    return {
      riskScore,
      shouldBlock: riskScore > 70,
      risks: riskScore > 70 ? [{ type: 'insufficient_amount', severity: 'high' }] : [],
      recommendation: riskScore > 70 ? 'Block payment' : 'Allow payment'
    };
  }
};

// Tools system
const tools = {
  async controlPump(pumpId, action, duration = 30) {
    return mockPumpController.controlPump(pumpId, action, duration);
  },
  async validatePayment(paymentData) {
    const isValid = paymentData.amount >= 25;
    const pumpTime = Math.floor(paymentData.amount / 25) * 30;
    return { valid: isValid, amount: paymentData.amount, customer: paymentData.customer, pumpDuration: pumpTime };
  },
  async sendNotification(message, type = 'info') {
    logger.info(`Notification [${type}]: ${message}`);
    notifications.push({ timestamp: new Date().toISOString(), message, type });
    return { sent: true, message, type };
  }
};

// LLM reasoning
async function processWithLLM(task) {
  try {
    const sensorData = mockSensors.getSensorData();
    const pumpStatus = mockPumpController.getStatus();
    
    const prompt = `You are FlowFli, an AI agent managing water pumps.

Task: ${JSON.stringify(task)}
Pump status: ${JSON.stringify(pumpStatus)}
Sensors: ${JSON.stringify(sensorData)}

Rules: $25 minimum, 30min per $25, max 4 hours

Respond with JSON:
{
  "reasoning": "your analysis",
  "actions": [
    {"tool": "validatePayment", "params": {"paymentData": {...}}},
    {"tool": "controlPump", "params": {"pumpId": "pump1", "action": "on", "duration": 30}}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content);
    reasoningLogs.push({ timestamp: new Date().toISOString(), task, reasoning: result.reasoning, actions: result.actions });
    return result;
  } catch (error) {
    logger.error('LLM error:', error);
    // Fallback logic
    const isValid = task.data.amount >= 25;
    return {
      reasoning: `Payment of $${task.data.amount} ${isValid ? 'approved' : 'rejected'} - ${isValid ? 'sufficient funds' : 'below minimum $25'}`,
      actions: isValid ? [
        {"tool": "validatePayment", "params": {"paymentData": task.data}},
        {"tool": "controlPump", "params": {"pumpId": "pump1", "action": "on", "duration": Math.floor(task.data.amount / 25) * 30}}
      ] : [
        {"tool": "sendNotification", "params": {"message": "Payment rejected - insufficient amount", "type": "error"}}
      ]
    };
  }
}

// Execute actions
async function executeActions(actions) {
  const results = [];
  for (const action of actions) {
    try {
      const tool = tools[action.tool];
      if (tool) {
        const result = await tool(...Object.values(action.params || {}));
        results.push({ action: action.tool, result, success: true });
      }
    } catch (error) {
      results.push({ action: action.tool, error: error.message, success: false });
    }
  }
  return results;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    alerts: 0,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  const sensorData = mockSensors.getSensorData();
  res.json({
    pumps: pumpStatus,
    sensors: sensorData,
    alerts: [],
    payments: paymentLogs.length,
    reasoning: reasoningLogs.length,
    notifications: notifications.length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/sensors', (req, res) => {
  res.json(mockSensors.getSensorData());
});

app.get('/api/logs/payments', (req, res) => {
  res.json(paymentLogs.slice(-50));
});

app.get('/api/logs/reasoning', (req, res) => {
  res.json(reasoningLogs.slice(-50));
});

app.get('/api/logs/notifications', (req, res) => {
  res.json(notifications.slice(-50));
});

// Payment processing
app.post('/api/simulate-payment', async (req, res) => {
  try {
    const paymentData = {
      paymentId: `test_${Date.now()}`,
      amount: req.body.amount,
      customer: req.body.customer,
      timestamp: new Date().toISOString()
    };
    
    const fraudAnalysis = await mockFraudDetection.analyzePayment(paymentData);
    if (fraudAnalysis.shouldBlock) {
      return res.status(403).json({
        success: false,
        error: 'Payment blocked by fraud detection',
        riskScore: fraudAnalysis.riskScore
      });
    }
    
    const task = { type: 'payment', data: paymentData, fraudAnalysis };
    const decision = await processWithLLM(task);
    const results = await executeActions(decision.actions);
    
    paymentLogs.push({ ...paymentData, processed: true, aiDecision: decision.reasoning, results });
    
    res.json({
      success: true,
      paymentId: paymentData.paymentId,
      reasoning: decision.reasoning,
      actions: results,
      fraudAnalysis: { riskScore: fraudAnalysis.riskScore, recommendation: fraudAnalysis.recommendation }
    });
    
  } catch (error) {
    logger.error('Payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ATP webhook
app.post('/api/atp/webhook', async (req, res) => {
  try {
    const { type, payload } = req.body;
    
    switch (type) {
      case 'payment_received':
        const fraudAnalysis = await mockFraudDetection.analyzePayment(payload);
        if (fraudAnalysis.shouldBlock) {
          return res.json({ success: false, error: 'Payment blocked', riskScore: fraudAnalysis.riskScore });
        }
        
        const pumpDuration = Math.floor(payload.amount / 25) * 30;
        if (pumpDuration > 0) {
          await mockPumpController.controlPump('pump1', 'on', pumpDuration);
          return res.json({ success: true, action: 'pump_activated', duration: pumpDuration });
        }
        return res.json({ success: false, error: 'Insufficient amount', minimum: 25 });
        
      case 'health_check':
        return res.json({ success: true, status: 'healthy', uptime: process.uptime() });
        
      default:
        return res.json({ success: true, message: 'FlowFli operational', capabilities: ['payment-processing', 'pump-control'] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATP test page
app.get('/api/atp/webhook', (req, res) => {
  res.send(`
    <h1>🤖 FlowFli ATP Webhook</h1>
    <p>ATP Integration Test Page</p>
    <button onclick="testHealth()">Health Check</button>
    <button onclick="testPayment()">Test Payment ($25)</button>
    <button onclick="testFraud()">Test Fraud ($10)</button>
    <div id="result" style="margin-top: 20px; padding: 10px; background: #f0f0f0;"></div>
    <script>
      async function testHealth() {
        const response = await fetch('/api/atp/webhook', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({type: 'health_check'})
        });
        document.getElementById('result').innerHTML = '<pre>' + JSON.stringify(await response.json(), null, 2) + '</pre>';
      }
      async function testPayment() {
        const response = await fetch('/api/atp/webhook', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({type: 'payment_received', payload: {amount: 25, customer: 'test_user'}})
        });
        document.getElementById('result').innerHTML = '<pre>' + JSON.stringify(await response.json(), null, 2) + '</pre>';
      }
      async function testFraud() {
        const response = await fetch('/api/atp/webhook', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({type: 'payment_received', payload: {amount: 10, customer: 'test_user'}})
        });
        document.getElementById('result').innerHTML = '<pre>' + JSON.stringify(await response.json(), null, 2) + '</pre>';
      }
    </script>
  `);
});

// Serve main UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  logger.info(`🚀 FlowFli running on http://localhost:${PORT}`);
  logger.info(`🎨 Dashboard: http://localhost:${PORT}`);
  logger.info(`🤖 ATP: http://localhost:${PORT}/api/atp/webhook`);
  logger.info(`🔧 API: http://localhost:${PORT}/api/status`);
});
