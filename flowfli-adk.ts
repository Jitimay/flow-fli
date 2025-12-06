import * as dotenv from "dotenv";
import { LlmAgent } from "@iqai/adk";
import { createTool } from "@iqai/adk";
import { z } from "zod";
import express from 'express';
import cors from 'cors';

dotenv.config();

// FlowFli state management
class FlowFliState {
  static pumpStatus = { pump1: 'off', pump2: 'off' };
  static paymentLogs: any[] = [];
  static reasoningLogs: any[] = [];
}

// Water pump control tool
const pumpControlTool = createTool({
  name: "controlPump",
  description: "Control water pump activation and duration based on payment validation",
  schema: z.object({
    pumpId: z.string().describe("Pump identifier (pump1, pump2)"),
    action: z.enum(["on", "off"]).describe("Pump action to perform"),
    duration: z.number().optional().default(30).describe("Duration in minutes for pump operation")
  }),
  fn: async ({ pumpId, action, duration = 30 }) => {
    console.log(`🚰 [ADK] Pump ${pumpId} ${action} for ${duration} minutes`);
    
    FlowFliState.pumpStatus[pumpId as keyof typeof FlowFliState.pumpStatus] = action;
    
    if (action === 'on') {
      // Auto-shutoff after duration
      setTimeout(() => {
        FlowFliState.pumpStatus[pumpId as keyof typeof FlowFliState.pumpStatus] = 'off';
        console.log(`🛑 [ADK] Pump ${pumpId} auto-stopped after ${duration} minutes`);
      }, duration * 60 * 1000);
    }
    
    return {
      success: true,
      pump: pumpId,
      status: action,
      duration: duration,
      timestamp: new Date().toISOString()
    };
  }
});

// Payment validation tool
const paymentValidationTool = createTool({
  name: "validatePayment",
  description: "Validate payment amount and calculate appropriate pump duration",
  schema: z.object({
    amount: z.number().describe("Payment amount in USD"),
    customer: z.string().describe("Customer identifier"),
    paymentMethod: z.string().optional().default("card").describe("Payment method used")
  }),
  fn: async ({ amount, customer, paymentMethod = "card" }) => {
    const isValid = amount >= 25;
    const pumpDuration = Math.floor(amount / 25) * 30; // 30 minutes per $25
    
    const payment = {
      paymentId: `adk_${Date.now()}`,
      amount,
      customer,
      paymentMethod,
      valid: isValid,
      pumpDuration,
      timestamp: new Date().toISOString(),
      reason: isValid ? "Payment approved" : "Insufficient amount - minimum $25 required"
    };
    
    FlowFliState.paymentLogs.push(payment);
    
    return payment;
  }
});

// Sensor monitoring tool
const sensorMonitoringTool = createTool({
  name: "getSensorData",
  description: "Get current water system sensor readings and alerts",
  schema: z.object({
    includeAlerts: z.boolean().optional().default(true).describe("Include system alerts in response")
  }),
  fn: async ({ includeAlerts = true }) => {
    const sensorData = {
      flowRate: { value: Math.round((Math.random() * 10 + 2) * 100) / 100, unit: 'L/min' },
      pressure: { value: Math.round((15 + Math.random() * 5) * 100) / 100, unit: 'PSI' },
      temperature: { value: Math.round((18 + Math.random() * 8) * 100) / 100, unit: '°C' },
      waterLevel: { value: Math.round((80 + Math.random() * 20) * 100) / 100, unit: '%' },
      timestamp: new Date().toISOString(),
      adkPowered: true
    };
    
    const alerts = includeAlerts ? [] : undefined; // No critical alerts in demo mode
    
    return { ...sensorData, alerts };
  }
});

// Fraud detection tool
const fraudDetectionTool = createTool({
  name: "analyzeFraud",
  description: "Analyze payment for potential fraud indicators and risk assessment",
  schema: z.object({
    amount: z.number().describe("Payment amount to analyze"),
    customer: z.string().describe("Customer identifier"),
    timestamp: z.string().optional().describe("Payment timestamp")
  }),
  fn: async ({ amount, customer, timestamp }) => {
    // Simple fraud detection logic
    const riskFactors = [];
    let riskScore = 0;
    
    if (amount < 25) {
      riskFactors.push("Below minimum payment threshold");
      riskScore += 60;
    }
    
    if (amount > 500) {
      riskFactors.push("Unusually high payment amount");
      riskScore += 30;
    }
    
    if (customer.includes('test')) {
      riskFactors.push("Test account detected");
      riskScore += 20;
    }
    
    const shouldBlock = riskScore > 70;
    
    return {
      riskScore,
      shouldBlock,
      riskFactors,
      recommendation: shouldBlock ? "Block payment - high risk" : "Allow payment - low risk",
      timestamp: new Date().toISOString()
    };
  }
});

// Create FlowFli Water Management Agent
export const getFlowFliAgent = () => {
  const agent = new LlmAgent({
    name: "FlowFli_Water_Agent",
    description: "AI-powered autonomous water pump control system for rural communities. Processes payments, validates transactions, monitors sensors, and controls water pumps safely and efficiently.",
    model: process.env.LLM_MODEL || "openai/gpt-3.5-turbo",
    tools: [
      pumpControlTool,
      paymentValidationTool,
      sensorMonitoringTool,
      fraudDetectionTool
    ],
    systemPrompt: `
      You are FlowFli, an AI water management agent built with ADK-TS for the IQAI Agent Arena Hackathon.
      
      Your mission: Provide clean water access to rural communities through AI-powered pump control.
      
      CORE RULES:
      - Minimum payment: $25 USD (provides 30 minutes of water)
      - Each additional $25 = +30 minutes (maximum 4 hours per session)
      - Always check fraud risk before processing payments
      - Monitor sensor data for safety alerts before pump activation
      - Prioritize water access while maintaining system security
      
      WORKFLOW:
      1. When receiving payment requests: validate amount → check fraud → activate pump if approved
      2. When asked about status: check sensors → report pump status → provide system health
      3. For emergencies: immediately stop pumps and report alerts
      
      Always explain your reasoning and prioritize both water access and system safety.
    `
  });

  return agent;
};

// Express server for FlowFli ADK integration
export function createFlowFliServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Get agent instance
  const agent = getFlowFliAgent();

  // ADK-powered payment endpoint
  app.post('/adk/payment', async (req, res) => {
    try {
      const { amount, customer } = req.body;
      
      const query = `Process a water payment of $${amount} from customer ${customer}. 
                     Check for fraud, validate the payment, and activate the water pump if approved.
                     Provide detailed reasoning for your decision.`;
      
      const response = await agent.ask(query);
      
      res.json({
        success: true,
        response,
        pumpStatus: FlowFliState.pumpStatus,
        adkPowered: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: (error as Error).message,
        adkPowered: true 
      });
    }
  });

  // System status endpoint
  app.get('/adk/status', async (req, res) => {
    try {
      const query = "Provide a complete system status report including pump status, sensor readings, and any alerts.";
      const response = await agent.ask(query);
      
      res.json({
        response,
        pumps: FlowFliState.pumpStatus,
        totalPayments: FlowFliState.paymentLogs.length,
        adkVersion: "0.5.7",
        framework: "ADK-TS",
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Emergency stop endpoint
  app.post('/adk/emergency', async (req, res) => {
    try {
      const query = "EMERGENCY: Immediately stop all water pumps and report system status.";
      const response = await agent.ask(query);
      
      res.json({
        success: true,
        response,
        emergencyMode: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Logs endpoint
  app.get('/adk/logs', (req, res) => {
    res.json({
      payments: FlowFliState.paymentLogs.slice(-10),
      pumpStatus: FlowFliState.pumpStatus,
      adkPowered: true
    });
  });

  return app;
}

// Main function to start FlowFli ADK agent
async function main() {
  console.log("🚀 Starting FlowFli ADK-TS Agent...");
  
  // Test the agent with sample queries
  const agent = getFlowFliAgent();
  
  console.log("🧪 Testing FlowFli Agent...");
  
  // Test 1: Valid payment
  console.log("\n💰 Test 1: Processing $50 payment");
  const response1 = await agent.ask("Process a $50 payment from customer john_doe for water access");
  console.log("🤖 Response:", response1);
  
  // Test 2: Invalid payment (fraud detection)
  console.log("\n🚨 Test 2: Processing $10 payment (should be blocked)");
  const response2 = await agent.ask("Process a $10 payment from customer test_user for water access");
  console.log("🤖 Response:", response2);
  
  // Test 3: System status
  console.log("\n📊 Test 3: System status check");
  const response3 = await agent.ask("What is the current system status?");
  console.log("🤖 Response:", response3);
  
  // Start Express server
  const app = createFlowFliServer();
  const PORT = process.env.PORT || 3002;
  
  app.listen(PORT, () => {
    console.log(`\n🌊 FlowFli ADK-TS Agent running on http://localhost:${PORT}`);
    console.log(`💰 Payment: POST /adk/payment`);
    console.log(`📊 Status: GET /adk/status`);
    console.log(`🚨 Emergency: POST /adk/emergency`);
    console.log(`📝 Logs: GET /adk/logs`);
    console.log(`\n✅ FlowFli is now HACKATHON COMPLIANT with ADK-TS! 🏆`);
  });
}

// Export for use in other files
export { FlowFliState };

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
