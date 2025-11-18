#!/bin/bash
# Script to check the status of the n8n EC2 instance

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
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
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

echo -e "${BLUE}Checking n8n EC2 instance status...${NC}"
echo ""

# Get instance details
INSTANCE_INFO=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'Reservations[0].Instances[0]' \
    --output json 2>/dev/null || echo "error")

if [ "$INSTANCE_INFO" = "error" ]; then
    echo -e "${RED}Error: Unable to find instance $INSTANCE_ID in region $AWS_REGION${NC}"
    exit 1
fi

# Parse details
STATE=$(echo "$INSTANCE_INFO" | grep -o '"Name": "[^"]*"' | head -1 | cut -d'"' -f4)
INSTANCE_TYPE=$(echo "$INSTANCE_INFO" | grep -o '"InstanceType": "[^"]*"' | cut -d'"' -f4)
PUBLIC_IP=$(echo "$INSTANCE_INFO" | grep -o '"PublicIpAddress": "[^"]*"' | cut -d'"' -f4)
PRIVATE_IP=$(echo "$INSTANCE_INFO" | grep -o '"PrivateIpAddress": "[^"]*"' | cut -d'"' -f4)
LAUNCH_TIME=$(echo "$INSTANCE_INFO" | grep -o '"LaunchTime": "[^"]*"' | cut -d'"' -f4)

# Display status with color
echo "Instance ID: $INSTANCE_ID"
echo "Region: $AWS_REGION"
echo "Instance Type: $INSTANCE_TYPE"
echo ""

case "$STATE" in
    "running")
        echo -e "State: ${GREEN}$STATE${NC}"
        ;;
    "stopped")
        echo -e "State: ${RED}$STATE${NC}"
        ;;
    "stopping"|"pending")
        echo -e "State: ${YELLOW}$STATE${NC}"
        ;;
    *)
        echo "State: $STATE"
        ;;
esac

if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
    echo "Public IP: $PUBLIC_IP"
    echo -e "n8n URL: ${BLUE}http://$PUBLIC_IP:5678${NC}"
fi

if [ -n "$PRIVATE_IP" ]; then
    echo "Private IP: $PRIVATE_IP"
fi

if [ -n "$LAUNCH_TIME" ]; then
    echo "Launch Time: $LAUNCH_TIME"
fi

echo ""

# Provide helpful commands
if [ "$STATE" = "running" ]; then
    echo "To stop this instance:"
    echo "  ./stop-ec2.sh $INSTANCE_ID"
elif [ "$STATE" = "stopped" ]; then
    echo "To start this instance:"
    echo "  ./start-ec2.sh $INSTANCE_ID"
fi

