# FlowFli - ATP Water Management Agent

AI agent for automated water pump control and payment processing (no n8n required).

## Quick Start

1. **Backend**: `cd backend && npm install && npm start`
2. **Frontend**: `cd frontend && npm install && npm run dev`
3. **Test**: Open http://localhost:3000 and click "Test $25 Payment"

## Architecture

- **Backend**: Node.js ATP agent with integrated payment processing
- **Frontend**: Next.js dashboard with real-time monitoring
- **AI**: OpenAI GPT-4 for payment validation and pump control decisions

## Key Features

- **Direct Payment Processing**: No n8n dependency
- **AI-Powered Decisions**: Smart pump control based on payment amounts
- **Auto-Shutoff**: Pumps automatically stop after allocated time
- **Real-time Dashboard**: Live activity feed and pump status
- **ATP Compatible**: Ready for Agent Arena deployment

## Payment Logic

- Minimum $25 payment required
- Each $25 = 30 minutes pump time
- Maximum 4 hours per session
- Invalid payments are rejected

## Environment Variables

```bash
# Backend (.env)
OPENAI_API_KEY=your_key
ATP_AGENT_ID=your_agent_id
PORT=3001

# Frontend (.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## API Endpoints

- `POST /payment` - Process payments directly
- `POST /webhook` - ATP agent webhook
- `POST /simulate-payment` - Test payment processing
- `GET /status` - System status
- `GET /logs/*` - Activity logs
