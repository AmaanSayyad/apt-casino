#!/bin/bash

# APT Casino Deployment Script
# This script deploys the entire casino application to Aptos testnet/mainnet and Vercel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# Default values
NETWORK="mainnet"
DEPLOY_FRONTEND=true
DEPLOY_CONTRACTS=true
VERBOSE=false

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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    # Check Aptos CLI
    if ! command_exists aptos; then
        print_warning "Aptos CLI is not installed. Installing..."
        curl -fsSL "https://aptoslabs.com/scripts/install_cli.py" | python3
    fi
    
    # Check Vercel CLI
    if ! command_exists vercel; then
        print_warning "Vercel CLI is not installed. Installing..."
        npm install -g vercel
    fi
    
    print_status "All prerequisites are satisfied"
}

# Function to check environment variables
check_environment() {
    print_step "Checking environment variables..."
    
    if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
        print_error "DEPLOYER_PRIVATE_KEY environment variable is not set"
        exit 1
    fi
    
    if [ -z "$NEXT_PUBLIC_CASINO_MODULE_ADDRESS" ]; then
        print_warning "NEXT_PUBLIC_CASINO_MODULE_ADDRESS not set, will use default"
    fi
    
    print_status "Environment variables are configured"
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    npm install
    
    print_status "Dependencies installed successfully"
}

# Function to compile Move contracts
compile_contracts() {
    print_step "Compiling Move contracts..."
    
    cd "$PROJECT_ROOT/move-contracts"
    
    if [ "$VERBOSE" = true ]; then
        node scripts/compile-aptos.mjs
    else
        node scripts/compile-aptos.mjs
    fi
    
    if [ $? -eq 0 ]; then
        print_status "Contracts compiled successfully"
    else
        print_error "Contract compilation failed"
        exit 1
    fi
}

# Function to deploy Move contracts
deploy_contracts() {
    print_step "Deploying Move contracts to $NETWORK..."
    
    cd "$PROJECT_ROOT/move-contracts"
    
    if [ "$VERBOSE" = true ]; then
        node scripts/deploy-aptos.mjs "$NETWORK"
    else
        node scripts/deploy-aptos.mjs "$NETWORK"
    fi
    
    if [ $? -eq 0 ]; then
        print_status "Contracts deployed successfully to $NETWORK"
    else
        print_error "Contract deployment failed"
        exit 1
    fi
}

# Function to build frontend
build_frontend() {
    print_step "Building frontend..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables for build
    export NEXT_PUBLIC_APTOS_NETWORK="$NETWORK"
    
    if [ "$VERBOSE" = true ]; then
        npm run build
    else
        npm run build >/dev/null 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        print_status "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
}

# Function to deploy to Vercel
deploy_vercel() {
    print_step "Deploying to Vercel..."
    
    cd "$PROJECT_ROOT"
    
    # Check if user is logged in to Vercel
    if ! vercel whoami >/dev/null 2>&1; then
        print_warning "Not logged in to Vercel. Please login first:"
        print_status "Run: vercel login"
        exit 1
    fi
    
    # Deploy to Vercel
    if [ "$VERBOSE" = true ]; then
        vercel --prod
    else
        vercel --prod --yes
    fi
    
    if [ $? -eq 0 ]; then
        print_status "Frontend deployed to Vercel successfully"
    else
        print_error "Vercel deployment failed"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    print_step "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run frontend tests
    if [ -f "package.json" ] && grep -q "\"test\":" package.json; then
        npm test
    fi
    
    # Run contract tests
    cd move-contracts
    aptos move test --skip-fetch-latest-git-deps
    
    print_status "Tests completed"
}

# Function to show help
show_help() {
    echo "APT Casino Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -n, --network NETWORK    Specify network (testnet/mainnet) [default: mainnet]"
    echo "  -c, --contracts-only     Deploy only contracts"
    echo "  -f, --frontend-only      Deploy only frontend"
    echo "  -t, --test               Run tests before deployment"
    echo "  -v, --verbose            Verbose output"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DEPLOYER_PRIVATE_KEY              Private key for contract deployment"
    echo "  NEXT_PUBLIC_CASINO_MODULE_ADDRESS Module address for deployed contracts"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy everything to testnet"
    echo "  $0 -n mainnet               # Deploy everything to mainnet"
    echo "  $0 -c -n testnet            # Deploy only contracts to testnet"
    echo "  $0 -f                       # Deploy only frontend"
    echo "  $0 -t -v                    # Run tests and deploy with verbose output"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--network)
            NETWORK="$2"
            shift 2
            ;;
        -c|--contracts-only)
            DEPLOY_FRONTEND=false
            shift
            ;;
        -f|--frontend-only)
            DEPLOY_CONTRACTS=false
            shift
            ;;
        -t|--test)
            RUN_TESTS=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate network
if [[ "$NETWORK" != "testnet" && "$NETWORK" != "mainnet" ]]; then
    print_error "Invalid network. Use 'testnet' or 'mainnet'"
    exit 1
fi

# Main deployment function
main() {
    echo "🚀 APT Casino Deployment Script"
    echo "Network: $NETWORK"
    echo "Deploy Contracts: $DEPLOY_CONTRACTS"
    echo "Deploy Frontend: $DEPLOY_FRONTEND"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Check environment
    check_environment
    
    # Install dependencies
    install_dependencies
    
    # Run tests if requested
    if [ "$RUN_TESTS" = true ]; then
        run_tests
    fi
    
    # Deploy contracts if requested
    if [ "$DEPLOY_CONTRACTS" = true ]; then
        compile_contracts
        deploy_contracts
    fi
    
    # Deploy frontend if requested
    if [ "$DEPLOY_FRONTEND" = true ]; then
        build_frontend
        deploy_vercel
    fi
    
    echo ""
    print_status "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Vercel dashboard"
    echo "2. Test the deployed application"
    echo "3. Monitor contract events and transactions"
    echo ""
    echo "For support, check the README.md file"
}

# Run main function
main "$@" 