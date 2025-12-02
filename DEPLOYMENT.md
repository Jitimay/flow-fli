# FlowFli Deployment Guide (No n8n)

## 1. Backend Deployment (Render/Railway)

### Render Deployment
1. Connect GitHub repo to Render
2. Create new Web Service
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables:
   - `OPENAI_API_KEY`
   - `ATP_AGENT_ID`
   - `PORT` (auto-set by Render)

### Railway Deployment
```bash
cd backend
railway login
railway init
railway add
railway deploy
```

## 2. Frontend Deployment (Vercel)

```bash
cd frontend
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com`

## 3. ATP Agent Registration

### Register Agent
```bash
# Install ATP CLI
npm install -g @atp/cli

# Login to ATP
atp login

# Register agent
atp agent create \
  --name "FlowFli" \
  --description "Water pump control agent with integrated payment processing" \
  --webhook-url "https://your-backend-url.com/webhook" \
  --capabilities "payment-processing,pump-control"
```

## 4. Payment System Integration

### Direct Integration
Point your payment system to send webhooks to:
```
https://your-backend-url.com/payment
```

### Payment Webhook Format
```json
{
  "paymentId": "pay_123",
  "amount": 50,
  "customer": "user123",
  "method": "card",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 5. Test the System

### Test Payment Processing
```bash
curl -X POST https://your-backend-url.com/payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "test123",
    "amount": 25,
    "customer": "test_user"
  }'
```

### Test ATP Webhook
```bash
curl -X POST https://your-backend-url.com/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "manual",
    "command": "system_check"
  }'
```

## 6. Monitoring

### Health Checks
- Backend: `https://your-backend-url.com/health`
- Frontend: Vercel automatically monitors

### Logs
- Backend logs: Check Render/Railway logs
- Frontend: Vercel function logs
- Activity logs: Available via API endpoints

## Environment Variables Summary

### Backend (.env)
```
OPENAI_API_KEY=sk-...
ATP_AGENT_ID=agent_...
PORT=3001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

## Troubleshooting

### Common Issues
1. **CORS errors**: Ensure backend CORS is configured for frontend domain
2. **Payment failures**: Check OpenAI API key and rate limits
3. **ATP connection**: Verify agent registration and webhook URL

### Debug Commands
```bash
# Test backend health
curl https://your-backend-url.com/health

# Test payment simulation
curl -X POST https://your-backend-url.com/simulate-payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 25, "customer": "test"}'

# Check system status
curl https://your-backend-url.com/status
```
