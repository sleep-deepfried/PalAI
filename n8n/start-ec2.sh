#!/bin/bash
# Script to start the n8n EC2 instance

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

echo -e "${YELLOW}Starting n8n EC2 instance...${NC}"
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

# Check if instance is already running or pending
if [ "$CURRENT_STATE" = "running" ]; then
    echo -e "${GREEN}Instance is already running${NC}"
    
    # Get and display public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --region "$AWS_REGION" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)
    
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
        echo "Public IP: $PUBLIC_IP"
        echo "n8n URL: http://$PUBLIC_IP:5678"
    fi
    exit 0
fi

if [ "$CURRENT_STATE" = "pending" ]; then
    echo -e "${YELLOW}Instance is already starting. Waiting for it to run...${NC}"
    aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"
    echo -e "${GREEN}Instance started successfully${NC}"
    
    # Get and display public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --region "$AWS_REGION" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)
    
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
        echo "Public IP: $PUBLIC_IP"
        echo "n8n URL: http://$PUBLIC_IP:5678"
    fi
    exit 0
fi

# Start the instance
if [ "$CURRENT_STATE" = "stopped" ]; then
    echo "Starting instance..."
    aws ec2 start-instances \
        --instance-ids "$INSTANCE_ID" \
        --region "$AWS_REGION" \
        --output text
    
    echo ""
    echo "Waiting for instance to start..."
    aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"
    
    echo -e "${GREEN}✓ Instance started successfully${NC}"
    
    # Get and display public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --region "$AWS_REGION" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)
    
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
        echo ""
        echo "Public IP: $PUBLIC_IP"
        echo "n8n URL: http://$PUBLIC_IP:5678"
        echo ""
        echo "Note: It may take a few moments for n8n to be fully ready"
    fi
    
    echo ""
    echo "To stop the instance, run:"
    echo "  ./stop-ec2.sh $INSTANCE_ID"
else
    echo -e "${YELLOW}Instance is in '$CURRENT_STATE' state. Cannot start.${NC}"
    exit 1
fi

