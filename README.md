# FlowFli - ATP Water Management Agent

🏆 **IQAI Agent Arena Hackathon Submission**

AI-powered autonomous water pump control system ready for IQAI's Agent Tokenization Platform (ATP).

## 🎯 **Hackathon Compliance**

### ✅ **ATP Integration Ready**
- **No Smart Contracts**: Uses IQAI's ATP for on-chain functionality
- **Webhook Integration**: `/atp/webhook` endpoint for ATP communication
- **Agent Metadata**: Complete agent description and capabilities
- **Health Monitoring**: ATP-compatible health checks

### ✅ **Core Features**
- 🤖 **Autonomous AI Reasoning**: OpenAI GPT-3.5-turbo makes all decisions
- 💧 **IoT Water Management**: Real pump control + sensor monitoring  
- 🔒 **Fraud Detection**: AI-powered anomaly detection
- 📊 **Transparent Dashboard**: Beautiful UI showing all AI decisions
- ⚡ **Real-time Processing**: Live payment processing and pump control

## 🚀 **Quick Start**

```bash
# Backend
cd backend && npm install && npm start

# Frontend  
cd frontend && npm install && npm run dev

# Access: http://localhost:3000
```

## 🏗️ **Architecture**

```
Frontend (Next.js) → Backend Agent (Node.js) → ATP Platform → On-Chain
                  ↓
              IoT Hardware (Pumps + Sensors)
```

## 🎨 **Demo Features**

### **AI Decision Making**
- Payment validation with fraud detection
- Sensor-based safety checks  
- Autonomous pump control decisions
- Real-time reasoning logs

### **IoT Integration**
- Mock hardware mode (safe for demo)
- Real sensor data simulation
- Pump control with auto-shutoff
- Safety alerts and monitoring

### **Security & Governance**
- Multi-factor fraud detection
- Risk scoring and blocking
- Emergency stop capabilities
- Transparent audit logs

## 📱 **ATP Launch Configuration**

### **Agent Metadata**
```json
{
  "name": "FlowFli Water Management Agent",
  "description": "AI-powered autonomous water pump control",
  "capabilities": [
    "payment-processing",
    "pump-control", 
    "sensor-monitoring",
    "fraud-detection",
    "autonomous-decisions"
  ],
  "webhookUrl": "https://your-domain.com/atp/webhook"
}
```

### **Launch Requirements**
- ✅ **IQ Tokens**: Will receive airdrop after hackathon
- ✅ **Webhook**: `/atp/webhook` endpoint ready
- ✅ **Health Check**: `/health` endpoint active
- ✅ **Documentation**: Complete README and API docs

## 🎯 **Hackathon Submission**

### **Required Elements**
- ✅ **GitHub Repository**: https://github.com/Jitimay/flow-fli
- ✅ **Demo Video**: Shows AI reasoning and pump control
- ✅ **Live Demo**: Fully functional at demo URL
- ✅ **ATP Integration**: Ready for platform launch
- ✅ **Documentation**: Complete setup and usage guide

### **Innovation Highlights**
- 🌍 **Social Impact**: Addresses global water access
- 🤖 **AI Autonomy**: No hard-coded rules, pure AI decisions
- 🔗 **Multi-Modal**: Combines AI + IoT + Blockchain + Payments
- 🎨 **Professional UI**: Production-ready interface
- 🔒 **Enterprise Security**: Fraud detection and governance

## 🏆 **Competitive Advantages**

1. **Real-World Utility**: Solves actual water access problems
2. **Complete Implementation**: Full-stack solution with beautiful UI
3. **AI-First Design**: Autonomous decision making throughout
4. **Production Ready**: Enterprise-grade security and monitoring
5. **Social Impact**: Meaningful contribution to global challenges

## 🔧 **Environment Setup**

```bash
# Backend (.env)
OPENAI_API_KEY=your_openai_key
ATP_ENABLED=true
BASE_URL=https://your-domain.com
MOCK_HARDWARE=true

# Frontend (.env.local)  
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

## 📊 **API Endpoints**

- `POST /atp/webhook` - ATP platform integration
- `GET /health` - System health for ATP
- `POST /payment` - Process payments with AI
- `GET /status` - Real-time system status
- `GET /logs/*` - Transparent decision logs

## 🎬 **Demo Script**

1. **Show Dashboard**: Beautiful UI with real-time data
2. **Test Payment**: $25 payment → AI reasoning → pump activation  
3. **Fraud Detection**: $10 payment → AI blocks with explanation
4. **Sensor Integration**: Live sensor data and alerts
5. **ATP Ready**: Show webhook endpoint and health check

## 🏅 **Awards Targeting**

- 🥇 **1st Place**: Complete solution with social impact
- 🤖 **IQAI MVP**: Perfect ATP integration and AI autonomy
- 💡 **Innovation**: Novel AI + IoT + Water access solution

FlowFli represents the future of autonomous AI agents solving real-world problems! 🌟
