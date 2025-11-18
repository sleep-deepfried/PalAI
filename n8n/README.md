# n8n Workflows for PalAI

This folder contains n8n workflows and configuration for PalAI's AI integration.

## Files

### Workflows
- **`n8n-workflow-palai.json`** - Disease diagnosis workflow
  - Webhook: `/webhook/palai-diagnose`
  - Uses AI Agent with Google Gemini Chat Model
  - Returns diagnosis result with label, confidence, severity, and explanations
  
- **`n8n-workflow-palai-treatment.json`** - Treatment guide workflow
  - Webhook: `/webhook/palai-treatment`
  - Generates prevention and treatment steps
  - Returns bilingual step-by-step instructions with sources

### Configuration
- **`docker-compose.yml`** - Local n8n instance setup
  - Runs n8n on port 5678
  - Persists data in `~/.n8n`

## Quick Start

### 1. Start n8n

```bash
cd n8n
docker-compose up -d
```

Access n8n at `http://localhost:5678`

### 2. Import Workflows

1. Open n8n web interface
2. Click **"Workflows"** → **"Import from File"**
3. Import both JSON files:
   - `n8n-workflow-palai.json`
   - `n8n-workflow-palai-treatment.json`

### 3. Configure Credentials

For each workflow:
1. Open the workflow
2. Click on **"Google Gemini Chat Model"** node
3. Add your Google PaLM API credentials
4. Save and activate the workflow

### 4. Get Webhook URLs

1. Click on the **Webhook** node in each workflow
2. Copy the **Production URL**
3. Update your `apps/palai/.env.local`:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/palai-diagnose
N8N_TREATMENT_WEBHOOK_URL=http://localhost:5678/webhook/palai-treatment
```

### 5. Activate Workflows

Toggle the **Active** switch in the top-right of each workflow.

## Workflows Overview

### Diagnosis Workflow
```
Webhook → Parse Request → Validate → AI Agent (Gemini) → Validate Response → Success
```

**Input:**
```json
{
  "imageBase64": "...",
  "mimeType": "image/jpeg",
  "locale": "en",
  "fieldNotes": "optional notes"
}
```

**Output:**
```json
{
  "label": "BLAST",
  "confidence": 0.95,
  "severity": "HIGH",
  "explanationEn": "...",
  "explanationTl": "...",
  "cautions": ["..."]
}
```

### Treatment Workflow
```
Webhook → Parse Request → Validate → AI Agent (Gemini) → Validate Response → Success
```

**Input:**
```json
{
  "disease": "BLAST",
  "language": "en"
}
```

**Output:**
```json
{
  "preventionSteps": [...],
  "treatmentSteps": [...],
  "sources": [...]
}
```

## Testing

### Test Diagnosis Workflow
```bash
curl -X POST http://localhost:5678/webhook/palai-diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "imageBase64": "BASE64_IMAGE_HERE",
      "mimeType": "image/jpeg",
      "locale": "en"
    }
  }'
```

### Test Treatment Workflow
```bash
curl -X POST http://localhost:5678/webhook/palai-treatment \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "disease": "BLAST",
      "language": "en"
    }
  }'
```

## Production Deployment

For production use:

1. **Deploy n8n** to a cloud service:
   - n8n Cloud (easiest)
   - Railway
   - Render
   - DigitalOcean
   - AWS/GCP/Azure

2. **Update URLs** in your app's environment variables to point to production n8n

3. **Enable HTTPS** on your n8n instance

4. **Set up authentication** to secure webhooks

5. **Implement rate limiting** to prevent abuse

## Managing EC2 Instance

If you're running n8n on AWS EC2, use these scripts to manage your instance:

### Prerequisites

1. Install [AWS CLI](https://aws.amazon.com/cli/)
2. Configure AWS credentials:
   ```bash
   aws configure
   ```

### Setup

Set your EC2 instance ID as an environment variable:

```bash
export N8N_EC2_INSTANCE_ID=i-xxxxxxxxxxxxx
export AWS_REGION=us-east-1  # Optional, defaults to us-east-1
```

Or add to your `~/.zshrc` or `~/.bashrc`:

```bash
echo 'export N8N_EC2_INSTANCE_ID=i-xxxxxxxxxxxxx' >> ~/.zshrc
source ~/.zshrc
```

### Stop Instance

Stop the EC2 instance to save costs when not in use:

```bash
cd n8n
./stop-ec2.sh
```

Or with instance ID directly:

```bash
./stop-ec2.sh i-xxxxxxxxxxxxx
```

### Start Instance

Start the EC2 instance when you need it:

```bash
cd n8n
./start-ec2.sh
```

The script will display the public IP and n8n URL once started.

### Check Status

Check the current status of your instance:

```bash
cd n8n
./ec2-status.sh
```

This shows:
- Instance state (running/stopped/stopping/pending)
- Instance type
- Public and private IPs
- n8n URL (when running)

## Troubleshooting

### Workflow not executing
- Check if workflow is **Active** (toggle in top-right)
- Verify webhook URL is correct
- Check n8n logs: `docker-compose logs -f`

### Invalid credentials
- Ensure Google PaLM API key is correct
- Check if API has proper permissions
- Verify quota limits

### Connection refused
- Ensure n8n is running: `docker-compose ps`
- Check port 5678 is not in use by another service
- Verify firewall settings

## References

- [n8n Documentation](https://docs.n8n.io/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Main PalAI README](../README.md)

