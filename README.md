# FlowFli - Complete ATP Water Management System

AI-powered water pump control with blockchain integration, IoT sensors, and ATP agent protocol.

## 🏗️ Architecture

```
UI (Next.js) → Backend Agent (Node.js) → Smart Contracts + Hardware + Database
```

## 🚀 Quick Start

1. **Backend**: `cd backend && npm install && npm start`
2. **Frontend**: `cd frontend && npm install && npm run dev`
3. **Access**: http://localhost:3000

## 🔧 Features

### Core Components
- ✅ **Backend Agent**: Node.js with LLM reasoning
- ✅ **Smart Contracts**: WaterCredit token + AgentController
- ✅ **Hardware Integration**: Pump control + sensor monitoring
- ✅ **Database**: SQLite with analytics
- ✅ **ATP Protocol**: Full agent compliance
- ✅ **Modern UI**: Next.js dashboard

### Capabilities
- 🤖 **AI Decision Making**: OpenAI GPT-3.5-turbo via OpenRouter
- 💰 **Payment Processing**: Crypto + fiat integration
- 🔧 **Pump Control**: Nema 17 stepper motor support
- 📊 **Sensor Monitoring**: Flow, pressure, temperature, level
- 📈 **Analytics**: Event logging and metrics
- 🔗 **Blockchain**: ERC20 water credits

## 📁 Project Structure

```
FlowFli/
├── backend/
│   ├── database/           # SQLite database layer
│   ├── hardware/           # IoT device integration
│   ├── analytics/          # Event logging & metrics
│   ├── atp/               # ATP agent protocol
│   ├── blockchain/        # Smart contract integration
│   └── server.js          # Main server
├── contracts/             # Solidity smart contracts
├── frontend/              # Next.js dashboard
└── docs/                  # Documentation
```

## ⚙️ Configuration

### Environment Variables
```bash
# OpenAI
OPENAI_API_KEY=your_key

# ATP (optional)
ATP_ENABLED=true
ATP_AGENT_ID=your_id

# Blockchain (optional)
BLOCKCHAIN_ENABLED=true
WATER_CREDIT_CONTRACT=0x...

# Hardware
MOCK_HARDWARE=true  # Set false for real hardware
```

### Hardware Setup
- **Pumps**: Nema 17 stepper motors via serial
- **Sensors**: Arduino with flow/pressure/temp sensors
- **Communication**: USB serial ports

## 🔗 Integration

### Smart Contracts
- **WaterCredit**: ERC20 token for water payments
- **AgentController**: ATP agent management
- **Treasury**: Payment collection and distribution

### ATP Protocol
- Agent registration and capabilities
- Task processing and status reporting
- Autonomous decision making

### IoT Hardware
- Real-time sensor data collection
- Pump control via serial commands
- Alert system for critical conditions

## 📊 Monitoring

- **Dashboard**: Real-time pump status and controls
- **Analytics**: Payment logs and AI reasoning
- **Alerts**: Sensor-based safety notifications
- **Metrics**: System performance tracking

## 🚀 Deployment

See `DEPLOYMENT.md` for production setup instructions.

## 🔒 Security

- API keys in environment variables
- Smart contract access controls
- Hardware safety interlocks
- Event logging and audit trails
