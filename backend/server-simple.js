const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
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

// In-memory storage for demo
let pumpStatus = { pump1: 'off', pump2: 'off' };
let paymentLogs = [];
let reasoningLogs = [];
let notifications = [];

// Mock hardware and sensors
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
  getAlerts() {
    return [];
  }
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
  getStatus() {
    return pumpStatus;
  }
};

// Simple fraud detection
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
  }
};

// LLM reasoning function
async function processWithLLM(task) {
  try {
    const sensorData = mockSensors.getSensorData();
    const pumpStatus = mockPumpController.getStatus();
    
    const prompt = `You are FlowFli, an AI agent managing water pumps based on payments and sensor data.

Task: ${JSON.stringify(task)}
Current pump status: ${JSON.stringify(pumpStatus)}
Sensor data: ${JSON.stringify(sensorData)}

Rules:
- Minimum $25 payment required
- Each $25 = 30 minutes pump time
- Maximum 4 hours per session
- Check sensor alerts before activation

Analyze and respond with JSON:
{
  "reasoning": "your analysis including sensor considerations",
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
        const result = await tool(...Object.values(action.params || {}));
        results.push({ action: action.tool, result, success: true });
      }
    } catch (error) {
      results.push({ action: action.tool, error: error.message, success: false });
    }
  }
  
  return results;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    alerts: 0,
    timestamp: new Date().toISOString()
  });
});

// ATP webhook endpoint
app.post('/atp/webhook', async (req, res) => {
  try {
    logger.info('ATP webhook received:', req.body);
    
    const { type, payload } = req.body;
    
    switch (type) {
      case 'payment_received':
        const fraudAnalysis = await mockFraudDetection.analyzePayment(payload);
        if (fraudAnalysis.shouldBlock) {
          return res.json({
            success: false,
            error: 'Payment blocked by fraud detection',
            riskScore: fraudAnalysis.riskScore
          });
        }
        
        const pumpDuration = Math.floor(payload.amount / 25) * 30;
        if (pumpDuration > 0) {
          await mockPumpController.controlPump('pump1', 'on', pumpDuration);
          return res.json({
            success: true,
            action: 'pump_activated',
            duration: pumpDuration,
            message: `Pump activated for ${pumpDuration} minutes`
          });
        }
        
        return res.json({
          success: false,
          error: 'Insufficient payment amount',
          minimum: 25
        });
        
      case 'health_check':
        return res.json({
          success: true,
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        });
        
      default:
        return res.json({
          success: true,
          message: 'FlowFli agent is operational',
          capabilities: ['payment-processing', 'pump-control', 'sensor-monitoring']
        });
    }
  } catch (error) {
    logger.error('ATP webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Payment processing endpoint
app.post('/simulate-payment', async (req, res) => {
  try {
    const paymentData = {
      paymentId: `test_${Date.now()}`,
      amount: req.body.amount,
      customer: req.body.customer,
      timestamp: new Date().toISOString()
    };
    
    // Fraud detection
    const fraudAnalysis = await mockFraudDetection.analyzePayment(paymentData);
    if (fraudAnalysis.shouldBlock) {
      return res.status(403).json({
        success: false,
        error: 'Payment blocked by fraud detection',
        riskScore: fraudAnalysis.riskScore
      });
    }
    
    // Process with AI
    const task = { type: 'payment', data: paymentData, fraudAnalysis };
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
      actions: results,
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

// Status endpoints
app.get('/status', (req, res) => {
  const sensorData = mockSensors.getSensorData();
  const alerts = mockSensors.getAlerts();
  
  res.json({
    pumps: pumpStatus,
    sensors: sensorData,
    alerts: alerts,
    payments: paymentLogs.length,
    reasoning: reasoningLogs.length,
    notifications: notifications.length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
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

app.get('/sensors', (req, res) => {
  res.json(mockSensors.getSensorData());
});

// ATP config endpoint
app.get('/atp/config', (req, res) => {
  res.json({
    agentMetadata: {
      name: 'FlowFli Water Management Agent',
      description: 'AI-powered autonomous water pump control',
      capabilities: ['payment-processing', 'pump-control', 'sensor-monitoring', 'fraud-detection'],
      version: '1.0.0'
    },
    webhookUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/atp/webhook`,
    healthCheckUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/health`
  });
});

app.listen(PORT, () => {
  logger.info(`FlowFli backend running on port ${PORT}`);
  logger.info('Mock hardware mode: true');
  logger.info('ATP integration: ready');
});
