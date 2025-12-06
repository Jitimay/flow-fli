import { Agent, AgentConfig } from '@iqai/adk';
import { z } from 'zod';
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import winston from 'winston';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// FlowFli ADK-TS Agent Implementation
class FlowFliAgent extends Agent {
  private openai: OpenAI;
  private logger: winston.Logger;
  private pumpStatus = { pump1: 'off', pump2: 'off' };
  private paymentLogs: any[] = [];
  private reasoningLogs: any[] = [];

  constructor(config: AgentConfig) {
    super(config);
    
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1'
    });

    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [new winston.transports.Console()]
    });

    this.setupTools();
  }

  private setupTools() {
    // Water pump control tool
    this.addTool({
      name: 'controlPump',
      description: 'Control water pump activation and duration',
      inputSchema: z.object({
        pumpId: z.string().describe('Pump identifier (pump1, pump2)'),
        action: z.enum(['on', 'off']).describe('Pump action'),
        duration: z.number().optional().describe('Duration in minutes')
      }),
      handler: async ({ pumpId, action, duration = 30 }) => {
        this.logger.info(`[ADK] Pump ${pumpId} ${action} for ${duration}min`);
        this.pumpStatus[pumpId as keyof typeof this.pumpStatus] = action;
        
        if (action === 'on') {
          setTimeout(() => {
            this.pumpStatus[pumpId as keyof typeof this.pumpStatus] = 'off';
            this.logger.info(`[ADK] Pump ${pumpId} auto-stopped`);
          }, duration * 60 * 1000);
        }
        
        return { success: true, pump: pumpId, status: action, duration };
      }
    });

    // Payment validation tool
    this.addTool({
      name: 'validatePayment',
      description: 'Validate payment and calculate pump duration',
      inputSchema: z.object({
        amount: z.number().describe('Payment amount in USD'),
        customer: z.string().describe('Customer identifier'),
        paymentId: z.string().optional().describe('Payment ID')
      }),
      handler: async ({ amount, customer, paymentId }) => {
        const isValid = amount >= 25;
        const pumpTime = Math.floor(amount / 25) * 30;
        
        const payment = {
          paymentId: paymentId || `adk_${Date.now()}`,
          amount,
          customer,
          valid: isValid,
          pumpDuration: pumpTime,
          timestamp: new Date().toISOString()
        };
        
        this.paymentLogs.push(payment);
        return payment;
      }
    });

    // Sensor data tool
    this.addTool({
      name: 'getSensorData',
      description: 'Get current sensor readings',
      inputSchema: z.object({}),
      handler: async () => {
        return {
          flowRate: { value: Math.random() * 10, unit: 'L/min' },
          pressure: { value: 15 + Math.random() * 5, unit: 'PSI' },
          temperature: { value: 18 + Math.random() * 8, unit: '°C' },
          waterLevel: { value: 80 + Math.random() * 20, unit: '%' },
          timestamp: new Date().toISOString(),
          adkMode: true
        };
      }
    });

    // Fraud detection tool
    this.addTool({
      name: 'analyzeFraud',
      description: 'Analyze payment for fraud indicators',
      inputSchema: z.object({
        amount: z.number(),
        customer: z.string(),
        timestamp: z.string().optional()
      }),
      handler: async ({ amount, customer }) => {
        const riskScore = amount < 25 ? 80 : 20;
        return {
          riskScore,
          shouldBlock: riskScore > 70,
          risks: riskScore > 70 ? [{ type: 'insufficient_amount', severity: 'high' }] : [],
          recommendation: riskScore > 70 ? 'Block payment' : 'Allow payment'
        };
      }
    });
  }

  // Main agent reasoning method
  async processWaterRequest(request: {
    type: 'payment' | 'status' | 'emergency';
    data: any;
  }) {
    try {
      const sensorData = await this.callTool('getSensorData', {});
      
      const prompt = `You are FlowFli, an AI water management agent built with ADK-TS.

Request: ${JSON.stringify(request)}
Current pumps: ${JSON.stringify(this.pumpStatus)}
Sensors: ${JSON.stringify(sensorData)}

Rules:
- Minimum payment: $25 (30 minutes pump time)
- Each additional $25 = +30 minutes
- Maximum 4 hours per session
- Check fraud before activation
- Prioritize safety and water access

Analyze the request and decide which tools to call. Respond with your reasoning and actions.`;

      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      });

      const reasoning = response.choices[0].message.content || 'No reasoning provided';
      
      // Log reasoning
      this.reasoningLogs.push({
        timestamp: new Date().toISOString(),
        request,
        reasoning,
        sensorData,
        pumpStatus: this.pumpStatus
      });

      return {
        success: true,
        reasoning,
        sensorData,
        pumpStatus: this.pumpStatus
      };

    } catch (error) {
      this.logger.error('ADK processing error:', error);
      throw error;
    }
  }

  // Express server integration
  setupExpressServer() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // ADK-TS enhanced endpoints
    app.post('/adk/payment', async (req, res) => {
      try {
        const { amount, customer } = req.body;
        
        // Fraud analysis
        const fraudAnalysis = await this.callTool('analyzeFraud', { amount, customer });
        if (fraudAnalysis.shouldBlock) {
          return res.status(403).json({
            success: false,
            error: 'Payment blocked by ADK fraud detection',
            riskScore: fraudAnalysis.riskScore
          });
        }

        // Payment validation
        const payment = await this.callTool('validatePayment', { amount, customer });
        
        if (payment.valid) {
          // Activate pump
          await this.callTool('controlPump', {
            pumpId: 'pump1',
            action: 'on',
            duration: payment.pumpDuration
          });
        }

        // Process with AI reasoning
        const result = await this.processWaterRequest({
          type: 'payment',
          data: { amount, customer, payment, fraudAnalysis }
        });

        res.json({
          success: true,
          payment,
          fraudAnalysis,
          reasoning: result.reasoning,
          adkPowered: true
        });

      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get('/adk/status', async (req, res) => {
      const sensorData = await this.callTool('getSensorData', {});
      res.json({
        pumps: this.pumpStatus,
        sensors: sensorData,
        payments: this.paymentLogs.length,
        reasoning: this.reasoningLogs.length,
        adkVersion: '0.5.7',
        framework: 'ADK-TS'
      });
    });

    app.get('/adk/logs', (req, res) => {
      res.json({
        payments: this.paymentLogs.slice(-10),
        reasoning: this.reasoningLogs.slice(-10)
      });
    });

    return app;
  }
}

// Initialize and start FlowFli ADK Agent
async function startFlowFliAgent() {
  const config: AgentConfig = {
    name: 'FlowFli_Water_Agent',
    description: 'AI-powered autonomous water pump control system built with ADK-TS',
    version: '1.0.0'
  };

  const agent = new FlowFliAgent(config);
  const app = agent.setupExpressServer();
  
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`🤖 FlowFli ADK-TS Agent running on http://localhost:${PORT}`);
    console.log(`🎯 ADK Payment: POST /adk/payment`);
    console.log(`📊 ADK Status: GET /adk/status`);
    console.log(`📝 ADK Logs: GET /adk/logs`);
  });
}

export { FlowFliAgent, startFlowFliAgent };

// Start if run directly
if (require.main === module) {
  startFlowFliAgent().catch(console.error);
}
