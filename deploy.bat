@echo off
setlocal enabledelayedexpansion

REM APT Casino Deployment Script for Windows
REM This script deploys the entire casino application to Aptos testnet/mainnet and Vercel

REM Configuration
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%"

REM Default values
set "NETWORK=mainnet"
set "DEPLOY_FRONTEND=true"
set "DEPLOY_CONTRACTS=true"
set "VERBOSE=false"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :main
if /i "%~1"=="-n" (
    set "NETWORK=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--network" (
    set "NETWORK=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-c" (
    set "DEPLOY_FRONTEND=false"
    shift
    goto :parse_args
)
if /i "%~1"=="--contracts-only" (
    set "DEPLOY_FRONTEND=false"
    shift
    goto :parse_args
)
if /i "%~1"=="-f" (
    set "DEPLOY_CONTRACTS=false"
    shift
    goto :parse_args
)
if /i "%~1"=="--frontend-only" (
    set "DEPLOY_CONTRACTS=false"
    shift
    goto :parse_args
)
if /i "%~1"=="-v" (
    set "VERBOSE=true"
    shift
    goto :parse_args
)
if /i "%~1"=="--verbose" (
    set "VERBOSE=true"
    shift
    goto :parse_args
)
if /i "%~1"=="-h" goto :show_help
if /i "%~1"=="--help" goto :show_help
echo [ERROR] Unknown option: %~1
goto :show_help

:show_help
echo APT Casino Deployment Script
echo.
echo Usage: %0 [OPTIONS]
echo.
echo Options:
echo   -n, --network NETWORK    Specify network (testnet/mainnet) [default: testnet]
echo   -c, --contracts-only     Deploy only contracts
echo   -f, --frontend-only      Deploy only frontend
echo   -v, --verbose            Verbose output
echo   -h, --help               Show this help message
echo.
echo Environment Variables:
echo   DEPLOYER_PRIVATE_KEY              Private key for contract deployment
echo   NEXT_PUBLIC_CASINO_MODULE_ADDRESS Module address for deployed contracts
echo.
echo Examples:
echo   %0                           # Deploy everything to testnet
echo   %0 -n mainnet               # Deploy everything to mainnet
echo   %0 -c -n testnet            # Deploy only contracts to testnet
echo   %0 -f                       # Deploy only frontend
echo   %0 -v                       # Deploy with verbose output
exit /b 1

:main
echo 🚀 APT Casino Deployment Script
echo Network: %NETWORK%
echo Deploy Contracts: %DEPLOY_CONTRACTS%
echo Deploy Frontend: %DEPLOY_FRONTEND%
echo.

REM Check prerequisites
call :check_prerequisites
if errorlevel 1 exit /b 1

REM Check environment
call :check_environment
if errorlevel 1 exit /b 1

REM Install dependencies
call :install_dependencies
if errorlevel 1 exit /b 1

REM Deploy contracts if requested
if "%DEPLOY_CONTRACTS%"=="true" (
    call :compile_contracts
    if errorlevel 1 exit /b 1
    
    call :deploy_contracts
    if errorlevel 1 exit /b 1
)

REM Deploy frontend if requested
if "%DEPLOY_FRONTEND%"=="true" (
    call :build_frontend
    if errorlevel 1 exit /b 1
    
    call :deploy_vercel
    if errorlevel 1 exit /b 1
)

echo.
echo [INFO] 🎉 Deployment completed successfully!
echo.
echo Next steps:
echo 1. Set environment variables in Vercel dashboard
echo 2. Test the deployed application
echo 3. Monitor contract events and transactions
echo.
echo For support, check the README.md file
exit /b 0

:check_prerequisites
echo [STEP] Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm
    exit /b 1
)

REM Check Aptos CLI
aptos --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Aptos CLI is not installed. Installing...
    curl -fsSL "https://aptoslabs.com/scripts/install_cli.py" | python3
)

REM Check Vercel CLI
vercel --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Vercel CLI is not installed. Installing...
    npm install -g vercel
)

echo [INFO] All prerequisites are satisfied
exit /b 0

:check_environment
echo [STEP] Checking environment variables...

if "%DEPLOYER_PRIVATE_KEY%"=="" (
    echo [ERROR] DEPLOYER_PRIVATE_KEY environment variable is not set
    exit /b 1
)

if "%NEXT_PUBLIC_CASINO_MODULE_ADDRESS%"=="" (
    echo [WARNING] NEXT_PUBLIC_CASINO_MODULE_ADDRESS not set, will use default
)

echo [INFO] Environment variables are configured
exit /b 0

:install_dependencies
echo [STEP] Installing dependencies...

cd /d "%PROJECT_ROOT%"
if "%VERBOSE%"=="true" (
    npm install
) else (
    npm install >nul 2>&1
)

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

echo [INFO] Dependencies installed successfully
exit /b 0

:compile_contracts
echo [STEP] Compiling Move contracts...

cd /d "%PROJECT_ROOT%\move-contracts"

if "%VERBOSE%"=="true" (
    aptos move compile --verbose
) else (
    aptos move compile >nul 2>&1
)

if errorlevel 1 (
    echo [ERROR] Contract compilation failed
    exit /b 1
)

echo [INFO] Contracts compiled successfully
exit /b 0

:deploy_contracts
echo [STEP] Deploying Move contracts to %NETWORK%...

cd /d "%PROJECT_ROOT%\move-contracts"

if "%VERBOSE%"=="true" (
    node scripts/deploy.js %NETWORK%
) else (
    node scripts/deploy.js %NETWORK% >nul 2>&1
)

if errorlevel 1 (
    echo [ERROR] Contract deployment failed
    exit /b 1
)

echo [INFO] Contracts deployed successfully to %NETWORK%
exit /b 0

:build_frontend
echo [STEP] Building frontend...

cd /d "%PROJECT_ROOT%"

REM Set environment variables for build
set "NEXT_PUBLIC_APTOS_NETWORK=%NETWORK%"

if "%VERBOSE%"=="true" (
    npm run build
) else (
    npm run build >nul 2>&1
)

if errorlevel 1 (
    echo [ERROR] Frontend build failed
    exit /b 1
)

echo [INFO] Frontend built successfully
exit /b 0

:deploy_vercel
echo [STEP] Deploying to Vercel...

cd /d "%PROJECT_ROOT%"

REM Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Not logged in to Vercel. Please login first:
    echo [INFO] Run: vercel login
    exit /b 1
)

REM Deploy to Vercel
if "%VERBOSE%"=="true" (
    vercel --prod
) else (
    vercel --prod --yes >nul 2>&1
)

if errorlevel 1 (
    echo [ERROR] Vercel deployment failed
    exit /b 1
)

echo [INFO] Frontend deployed to Vercel successfully
exit /b 0 