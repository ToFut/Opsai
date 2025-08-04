#!/bin/bash

# Airbyte Terraform Setup Script
# This script helps set up the Terraform environment for Airbyte infrastructure management

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}
╔═══════════════════════════════════════════════════════════════╗
║                    Airbyte Terraform Setup                    ║
║                                                              ║
║  This script will help you set up Terraform for managing     ║
║  your Airbyte infrastructure as code.                        ║
╚═══════════════════════════════════════════════════════════════╝
${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Terraform
install_terraform() {
    print_status "Installing Terraform..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew tap hashicorp/tap
            brew install hashicorp/tap/terraform
        else
            print_error "Homebrew not found. Please install Homebrew first or install Terraform manually."
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
        sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
        sudo apt-get update && sudo apt-get install terraform
    else
        print_error "Unsupported operating system. Please install Terraform manually."
        exit 1
    fi
    
    print_status "Terraform installed successfully!"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Terraform
    if ! command_exists terraform; then
        print_warning "Terraform not found. Installing..."
        install_terraform
    else
        print_status "Terraform found: $(terraform --version | head -n1)"
    fi
    
    # Check AWS CLI (for S3 backend)
    if ! command_exists aws; then
        print_warning "AWS CLI not found. You may need it for S3 backend."
        print_status "Install with: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip' && unzip awscliv2.zip && sudo ./aws/install"
    else
        print_status "AWS CLI found: $(aws --version)"
    fi
    
    # Check Git
    if ! command_exists git; then
        print_error "Git not found. Please install Git."
        exit 1
    else
        print_status "Git found: $(git --version)"
    fi
}

# Function to create terraform.tfvars from example
setup_tfvars() {
    print_status "Setting up terraform.tfvars..."
    
    if [[ -f "terraform.tfvars" ]]; then
        print_warning "terraform.tfvars already exists. Backing up to terraform.tfvars.backup"
        cp terraform.tfvars terraform.tfvars.backup
    fi
    
    if [[ -f "terraform.tfvars.example" ]]; then
        cp terraform.tfvars.example terraform.tfvars
        print_status "Created terraform.tfvars from example. Please edit with your actual values."
    else
        print_error "terraform.tfvars.example not found. Please create it first."
        exit 1
    fi
}

# Function to setup AWS S3 backend (optional)
setup_s3_backend() {
    print_status "Setting up S3 backend for Terraform state..."
    
    read -p "Enter S3 bucket name for Terraform state (default: opsai-terraform-state): " bucket_name
    bucket_name=${bucket_name:-opsai-terraform-state}
    
    read -p "Enter AWS region (default: us-east-1): " aws_region
    aws_region=${aws_region:-us-east-1}
    
    read -p "Enter DynamoDB table name for state locking (default: opsai-terraform-locks): " dynamodb_table
    dynamodb_table=${dynamodb_table:-opsai-terraform-locks}
    
    # Create S3 bucket
    print_status "Creating S3 bucket: $bucket_name"
    aws s3 mb s3://$bucket_name --region $aws_region || print_warning "Bucket may already exist"
    
    # Enable versioning
    aws s3api put-bucket-versioning --bucket $bucket_name --versioning-configuration Status=Enabled
    
    # Enable encryption
    aws s3api put-bucket-encryption --bucket $bucket_name --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'
    
    # Create DynamoDB table for locking
    print_status "Creating DynamoDB table: $dynamodb_table"
    aws dynamodb create-table \
        --table-name $dynamodb_table \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region $aws_region || print_warning "Table may already exist"
    
    # Update backend.tf
    sed -i.backup "s/opsai-terraform-state/$bucket_name/g" backend.tf
    sed -i.backup "s/us-east-1/$aws_region/g" backend.tf
    sed -i.backup "s/opsai-terraform-locks/$dynamodb_table/g" backend.tf
    
    print_status "S3 backend configured successfully!"
}

# Function to validate Airbyte credentials
validate_airbyte_credentials() {
    print_status "Validating Airbyte credentials..."
    
    # Read credentials from terraform.tfvars
    if [[ -f "terraform.tfvars" ]]; then
        source <(grep -E '^[^#]*=' terraform.tfvars | sed 's/^/export /')
        
        # Test API connection
        if [[ -n "$airbyte_api_key" ]] && [[ -n "$airbyte_workspace_id" ]]; then
            curl_response=$(curl -s -w "%{http_code}" \
                -H "Authorization: Bearer $airbyte_api_key" \
                -H "Content-Type: application/json" \
                "$airbyte_api_url/workspaces/$airbyte_workspace_id" \
                -o /dev/null)
            
            if [[ "$curl_response" == "200" ]]; then
                print_status "Airbyte API credentials validated successfully!"
            else
                print_error "Failed to validate Airbyte credentials. HTTP status: $curl_response"
                print_error "Please check your API key and workspace ID in terraform.tfvars"
            fi
        else
            print_warning "Airbyte credentials not found in terraform.tfvars. Please add them."
        fi
    else
        print_error "terraform.tfvars not found. Please run setup first."
    fi
}

# Function to initialize Terraform
terraform_init() {
    print_status "Initializing Terraform..."
    
    terraform init
    
    if [[ $? -eq 0 ]]; then
        print_status "Terraform initialized successfully!"
    else
        print_error "Terraform initialization failed!"
        exit 1
    fi
}

# Function to validate Terraform configuration
terraform_validate() {
    print_status "Validating Terraform configuration..."
    
    terraform validate
    
    if [[ $? -eq 0 ]]; then
        print_status "Terraform configuration is valid!"
    else
        print_error "Terraform configuration validation failed!"
        exit 1
    fi
}

# Function to run Terraform plan
terraform_plan() {
    print_status "Running Terraform plan..."
    
    terraform plan -out=tfplan
    
    if [[ $? -eq 0 ]]; then
        print_status "Terraform plan completed successfully!"
        print_status "Review the plan above. Run 'terraform apply tfplan' to apply changes."
    else
        print_error "Terraform plan failed!"
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --setup              Full setup (check prerequisites, setup tfvars, init terraform)"
    echo "  --check-prereq       Check prerequisites only"
    echo "  --setup-tfvars       Setup terraform.tfvars from example"
    echo "  --setup-s3-backend   Setup S3 backend for state management"
    echo "  --validate-creds     Validate Airbyte credentials"
    echo "  --init               Initialize Terraform"
    echo "  --validate           Validate Terraform configuration"
    echo "  --plan               Run Terraform plan"
    echo "  --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --setup           # Full setup process"
    echo "  $0 --plan            # Run terraform plan"
    echo "  $0 --validate-creds  # Test Airbyte API connection"
}

# Main execution
main() {
    print_header
    
    case "${1:-}" in
        --setup)
            check_prerequisites
            setup_tfvars
            terraform_init
            terraform_validate
            print_status "Setup completed! Edit terraform.tfvars with your credentials, then run: $0 --plan"
            ;;
        --check-prereq)
            check_prerequisites
            ;;
        --setup-tfvars)
            setup_tfvars
            ;;
        --setup-s3-backend)
            setup_s3_backend
            ;;
        --validate-creds)
            validate_airbyte_credentials
            ;;
        --init)
            terraform_init
            ;;
        --validate)
            terraform_validate
            ;;
        --plan)
            terraform_plan
            ;;
        --help)
            show_usage
            ;;
        *)
            print_error "Invalid option. Use --help for usage information."
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"