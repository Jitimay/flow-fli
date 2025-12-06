import * as dotenv from "dotenv";
import { createTool, LlmAgent } from "@iqai/adk";
import { z } from "zod";

dotenv.config();

// Simple pump control tool
const pumpTool = createTool({
  name: "controlPump",
  description: "Control water pump",
  schema: z.object({
    action: z.string().describe("Pump action")
  }),
  fn: async ({ action }) => {
    console.log(`🚰 Pump ${action}`);
    return `Pump is now ${action}`;
  }
});

// Test ADK-TS integration
async function testADK() {
  console.log("🧪 Testing ADK-TS Integration...");
  
  try {
    const agent = new LlmAgent({
      name: "test_agent",
      description: "Test agent",
      model: "openai/gpt-3.5-turbo",
      tools: [pumpTool]
    });
    
    console.log("✅ Agent created successfully");
    console.log("🎯 ADK-TS integration working!");
    
    return true;
  } catch (error) {
    console.error("❌ ADK Error:", error);
    return false;
  }
}

testADK();
