# Start Consul in development mode.
# Run this script from: backend/consul-service/scripts/

$ErrorActionPreference = "Stop"

$CONSUL_VERSION = "1.20.0"
$CONSUL_DIR = "$PSScriptRoot\..\bin"
$CONSUL_EXE = "$CONSUL_DIR\consul.exe"
$DOWNLOAD_URL = "https://releases.hashicorp.com/consul/${CONSUL_VERSION}/consul_${CONSUL_VERSION}_windows_amd64.zip"
$ZIP_PATH = "$CONSUL_DIR\consul.zip"

# Create bin directory if it doesn't exist
if (-not (Test-Path $CONSUL_DIR)) {
    New-Item -ItemType Directory -Path $CONSUL_DIR -Force | Out-Null
}

# Download Consul if not present
if (-not (Test-Path $CONSUL_EXE)) {
    Write-Host "Downloading Consul v${CONSUL_VERSION}..." -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $ZIP_PATH -UseBasicParsing
    }
    catch {
        throw "Failed to download Consul from $DOWNLOAD_URL. Error: $($_.Exception.Message)"
    }

    if (-not (Test-Path $ZIP_PATH)) {
        throw "Download did not create expected file: $ZIP_PATH"
    }

    Write-Host "Extracting archive..." -ForegroundColor Cyan
    Expand-Archive -Path $ZIP_PATH -DestinationPath $CONSUL_DIR -Force
    Remove-Item $ZIP_PATH -Force

    if (-not (Test-Path $CONSUL_EXE)) {
        throw "Consul executable not found after extraction: $CONSUL_EXE"
    }

    Write-Host "Consul installed at: $CONSUL_EXE" -ForegroundColor Green
} else {
    Write-Host "Consul already installed at: $CONSUL_EXE" -ForegroundColor Green
}

# Start Consul in dev mode
Write-Host ""
Write-Host "Starting Consul in development mode..." -ForegroundColor Yellow
Write-Host "  UI:  http://127.0.0.1:8500/ui" -ForegroundColor Cyan
Write-Host "  API: http://127.0.0.1:8500/v1/status/leader" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

& $CONSUL_EXE agent -dev -ui
