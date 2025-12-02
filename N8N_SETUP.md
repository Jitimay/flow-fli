# n8n Workflow Setup Guide

## Step-by-Step Import Instructions

### 1. Access n8n
- Open your n8n instance (cloud or self-hosted)
- Login to your account

### 2. Import Workflow
1. Click "+" to create new workflow
2. Click the "..." menu in top right
3. Select "Import from file"
4. Upload the `n8n-workflow.json` file
5. Click "Import"

### 3. Configure Nodes

#### Payment Webhook Node
- Already configured to receive POST requests
- Note the webhook URL (you'll need this for payment system)
- Path: `/payment-webhook`

#### OpenAI Node (Analyze Payment)
1. Click on "Analyze Payment" node
2. Add your OpenAI API key in credentials
3. Model is set to GPT-4 (change to GPT-4-mini if needed)
4. System prompt is pre-configured

#### Function Node (Format Command)
- Pre-configured JavaScript code
- Formats AI response for backend agent
- No changes needed

#### HTTP Request Node (Send to FlowFli Agent)
1. Click on "Send to FlowFli Agent" node
2. Update URL to your backend endpoint:
   - Local: `http://localhost:3001/webhook`
   - Production: `https://your-backend-url.com/webhook`

#### Telegram Nodes (Optional)
1. Create Telegram bot via @BotFather
2. Get bot token and chat ID
3. Configure both notification nodes:
   - Success Notification
   - Error Notification
4. Or delete these nodes if not using Telegram

### 4. Test Workflow
1. Click "Execute Workflow" button
2. Or send test webhook:
```bash
curl -X POST https://your-n8n-instance.com/webhook/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "test123",
    "amount": 50,
    "customer": "john_doe",
    "timestamp": "2024-01-01T12:00:00Z"
  }'
```

### 5. Activate Workflow
1. Toggle the "Active" switch in top right
2. Workflow will now process real payments

## Workflow Logic

1. **Payment Webhook** receives payment data
2. **OpenAI Node** analyzes payment and decides pump action
3. **Function Node** formats the decision for backend
4. **HTTP Node** sends command to FlowFli backend agent
5. **Conditional Node** checks if successful
6. **Notification Nodes** send status updates

## Customization Options

### Modify AI Prompt
Edit the system message in OpenAI node:
```
You are processing a water payment. Analyze the payment data and determine if pumps should be activated based on:
- Payment amount (minimum $25)
- Customer status
- Current pump availability
Respond with JSON: {"valid": boolean, "pumpAction": "on/off", "duration": minutes, "message": "explanation"}
```

### Add More Nodes
- Database logging
- SMS notifications
- Slack alerts
- Custom API calls

### Error Handling
The workflow includes basic error handling, but you can add:
- Retry logic
- Dead letter queues
- Alert escalation

## Monitoring

### Execution Logs
- View in n8n interface under "Executions"
- Shows success/failure for each run
- Detailed node-by-node execution data

### Webhook Testing
Use n8n's webhook testing feature:
1. Click on webhook node
2. Click "Listen for calls"
3. Send test data
4. View results in real-time
