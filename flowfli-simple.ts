import * as dotenv from "dotenv";
import { createTool, LlmAgent } from "@iqai/adk";
import { z } from "zod";

dotenv.config();

// Simple state management
const FlowFliState = {
  pumpStatus: { pump1: 'off', pump2: 'off' },
  paymentLogs: [] as any[],
  totalPayments: 0
};

// Water pump control tool
const pumpTool = createTool({
  name: "controlPump",
  description: "Control water pump based on payment validation",
  schema: z.object({
    pumpId: z.string().describe("Pump ID (pump1 or pump2)"),
    action: z.enum(["on", "off"]).describe("Pump action"),
    duration: z.number().describe("Duration in minutes")
  }),
  fn: async ({ pumpId, action, duration }) => {
    console.log(`🚰 Pump ${pumpId} ${action} for ${duration} minutes`);
    FlowFliState.pumpStatus[pumpId as keyof typeof FlowFliState.pumpStatus] = action;
    
    if (action === 'on') {
      setTimeout(() => {
        FlowFliState.pumpStatus[pumpId as keyof typeof FlowFliState.pumpStatus] = 'off';
        console.log(`🛑 Pump ${pumpId} auto-stopped`);
      }, duration * 1000); // Shortened for demo
    }
    
    return `Pump ${pumpId} is now ${action} for ${duration} minutes`;
  }
});

// Payment validation tool
const paymentTool = createTool({
  name: "validatePayment",
  description: "Validate payment and calculate pump time",
  schema: z.object({
    amount: z.number().describe("Payment amount in USD"),
    customer: z.string().describe("Customer name")
  }),
  fn: async ({ amount, customer }) => {
    const isValid = amount >= 25;
    const pumpTime = Math.floor(amount / 25) * 30;
    
    const payment = {
      amount,
      customer,
      valid: isValid,
      pumpTime,
      timestamp: new Date().toISOString()
    };
    
    FlowFliState.paymentLogs.push(payment);
    FlowFliState.totalPayments++;
    
    return isValid 
      ? `Payment of $${amount} approved for ${customer}. Pump time: ${pumpTime} minutes`
      : `Payment of $${amount} rejected - minimum $25 required`;
  }
});

// Sensor data tool
const sensorTool = createTool({
  name: "getSensors",
  description: "Get current sensor readings",
  schema: z.object({}),
  fn: async () => {
    return {
      flowRate: Math.round(Math.random() * 10 * 100) / 100,
      pressure: Math.round((15 + Math.random() * 5) * 100) / 100,
      temperature: Math.round((20 + Math.random() * 5) * 100) / 100,
      waterLevel: Math.round((80 + Math.random() * 20) * 100) / 100,
      status: "All systems normal"
    };
  }
});

// Create FlowFli Agent
const flowfliAgent = new LlmAgent({
  name: "FlowFli_Agent",
  description: "AI water management system for rural communities",
  model: process.env.LLM_MODEL || "openai/gpt-3.5-turbo",
  tools: [pumpTool, paymentTool, sensorTool],
  systemPrompt: `
    You are FlowFli, an AI water management agent built with ADK-TS for the IQAI hackathon.
    
    RULES:
    - Minimum payment: $25 (30 minutes water)
    - Each $25 = 30 minutes pump time
    - Always validate payments before activating pumps
    - Check sensors for safety
    - Explain your decisions clearly
    
    When processing payments:
    1. Validate the payment amount
    2. If valid, activate the pump for calculated time
    3. Explain your reasoning
  `
});

// Main demo function
async function main() {
  console.log("🚀 FlowFli ADK-TS Agent Starting...\n");
  
  try {
    // Test 1: Valid payment
    console.log("💰 Test 1: $50 Payment");
    const response1 = await flowfliAgent.ask("Process a $50 payment from customer Alice for water access");
    console.log("🤖 Response:", response1);
    console.log("📊 Pump Status:", FlowFliState.pumpStatus);
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Test 2: Invalid payment
    console.log("🚨 Test 2: $10 Payment (Invalid)");
    const response2 = await flowfliAgent.ask("Process a $10 payment from customer Bob for water access");
    console.log("🤖 Response:", response2);
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Test 3: System status
    console.log("📊 Test 3: System Status");
    const response3 = await flowfliAgent.ask("What is the current system status including sensors and pumps?");
    console.log("🤖 Response:", response3);
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    console.log("✅ FlowFli ADK-TS Integration Complete!");
    console.log("🏆 HACKATHON COMPLIANT - Uses ADK-TS Framework");
    console.log("💧 Total Payments Processed:", FlowFliState.totalPayments);
    console.log("🚰 Current Pump Status:", FlowFliState.pumpStatus);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Export for use in other files
export { flowfliAgent, FlowFliState };

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
