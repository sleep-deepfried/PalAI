#!/bin/bash
# Script to stop the n8n EC2 instance

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
# Set your EC2 instance ID here or pass as first argument
INSTANCE_ID="${1:-${N8N_EC2_INSTANCE_ID}}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Check if instance ID is provided
if [ -z "$INSTANCE_ID" ]; then
    echo -e "${RED}Error: EC2 Instance ID not provided${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 <instance-id>"
    echo "  OR"
    echo "  export N8N_EC2_INSTANCE_ID=i-xxxxxxxxxxxxx"
    echo "  $0"
    echo ""
    echo "Example:"
    echo "  $0 i-0123456789abcdef0"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${YELLOW}Stopping n8n EC2 instance...${NC}"
echo "Instance ID: $INSTANCE_ID"
echo "Region: $AWS_REGION"
echo ""

# Get current instance state
echo "Checking current instance state..."
CURRENT_STATE=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'Reservations[0].Instances[0].State.Name' \
    --output text 2>/dev/null || echo "error")

if [ "$CURRENT_STATE" = "error" ] || [ -z "$CURRENT_STATE" ]; then
    echo -e "${RED}Error: Unable to find instance $INSTANCE_ID in region $AWS_REGION${NC}"
    echo "Please check:"
    echo "  1. Instance ID is correct"
    echo "  2. AWS region is correct"
    echo "  3. AWS credentials are configured"
    exit 1
fi

echo "Current state: $CURRENT_STATE"

# Check if instance is already stopped or stopping
if [ "$CURRENT_STATE" = "stopped" ]; then
    echo -e "${GREEN}Instance is already stopped${NC}"
    exit 0
fi

if [ "$CURRENT_STATE" = "stopping" ]; then
    echo -e "${YELLOW}Instance is already stopping. Waiting for it to stop...${NC}"
    aws ec2 wait instance-stopped --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"
    echo -e "${GREEN}Instance stopped successfully${NC}"
    exit 0
fi

# Stop the instance
if [ "$CURRENT_STATE" = "running" ] || [ "$CURRENT_STATE" = "pending" ]; then
    echo "Stopping instance..."
    aws ec2 stop-instances \
        --instance-ids "$INSTANCE_ID" \
        --region "$AWS_REGION" \
        --output text
    
    echo ""
    echo "Waiting for instance to stop..."
    aws ec2 wait instance-stopped --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"
    
    echo -e "${GREEN}✓ Instance stopped successfully${NC}"
    echo ""
    echo "To start the instance again, run:"
    echo "  ./start-ec2.sh $INSTANCE_ID"
else
    echo -e "${YELLOW}Instance is in '$CURRENT_STATE' state. Cannot stop.${NC}"
    exit 1
fi

