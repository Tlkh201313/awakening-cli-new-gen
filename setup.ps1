# Awakened CLI — Windows Setup (PowerShell)
# Clones the repo, installs dependencies, and registers 'awakened' globally.
#
# Usage:
#   irm https://raw.githubusercontent.com/Tlkh201313/awakening-cli-new-gen/dev/setup.ps1 | iex
#   .\setup.ps1 -Dir "C:\my-awakened" -Build

param(
    [string]$Dir = "$env:USERPROFILE\awakening-cli-new-gen",
    [switch]$SkipLink,
    [switch]$Build,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

$REPO_URL = "https://github.com/Tlkh201313/awakening-cli-new-gen.git"

function Write-Info    { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Warn    { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Fail    { param($msg) Write-Host "✗ $msg" -ForegroundColor Red; exit 1 }

if ($Help) {
    @"

Awakened CLI — Windows Setup (PowerShell)

Clones the repo, installs dependencies, and registers 'awakened' globally
via 'bun link'.

Usage: .\setup.ps1 [options]

Options:
    -Help           Display this help message
    -Dir <path>     Install directory (default: ~\awakening-cli-new-gen)
    -SkipLink       Skip global registration (bun link)
    -Build          Also build standalone binary (slower, no Bun at runtime)

Examples:
    irm https://raw.githubusercontent.com/Tlkh201313/awakening-cli-new-gen/dev/setup.ps1 | iex
    .\setup.ps1 -Dir "C:\Tools\awakened" -Build

"@
    exit 0
}

Write-Host ""
Write-Host "── Awakened CLI Setup (Windows) ───────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ── Step 1: Check / install Bun ────────────────────────────────────────────────
$bunPath = Get-Command bun -ErrorAction SilentlyContinue
if ($bunPath) {
    $bunVersion = bun --version 2>$null
    Write-Info "Bun found: v$bunVersion"
} else {
    Write-Warn "Bun not found. Installing..."
    try {
        Invoke-RestMethod -Uri "https://bun.sh/install.ps1" | Invoke-Expression
        $env:BUN_INSTALL = "$env:USERPROFILE\.bun"
        $env:Path = "$env:BUN_INSTALL\bin;$env:Path"
        $bunVersion = bun --version 2>$null
        Write-Info "Bun installed: v$bunVersion"
    } catch {
        Write-Fail "Bun installation failed. Install manually: https://bun.sh/docs/installation"
    }
}

# ── Step 2: Clone or update repo ──────────────────────────────────────────────
Write-Host ""
if (Test-Path "$Dir\.git") {
    Write-Info "Repo exists at $Dir — pulling latest..."
    try {
        git -C $Dir pull --ff-only 2>$null
    } catch {
        Write-Warn "Pull failed (local changes?). Using existing."
    }
} else {
    Write-Info "Cloning into $Dir ..."
    git clone --depth 1 $REPO_URL $Dir
}

Set-Location $Dir

# ── Step 3: Install dependencies + build ──────────────────────────────────────
Write-Host ""
Write-Info "Installing dependencies..."
bun install

Write-Host ""
Write-Info "Building CLI..."
bun run build

# ── Step 4: Register globally ─────────────────────────────────────────────────
if (-not $SkipLink) {
    Write-Host ""
    Write-Info "Registering 'awakened' command globally..."
    bun link
    Write-Info "Done — 'awakened' is now available globally."
} else {
    Write-Host ""
    Write-Warn "Skipping global registration (-SkipLink)."
    Write-Info "Run manually: cd $Dir; bun link"
}

# ── Step 5: Optional build ────────────────────────────────────────────────────
if ($Build) {
    Write-Host ""
    Write-Info "Building standalone binary..."
    bun run build
    Write-Info "Binary built in packages\awakened\dist\"
}

# ── Step 6: Verify ────────────────────────────────────────────────────────────
Write-Host ""
$awakenedPath = Get-Command awakened -ErrorAction SilentlyContinue
if ($awakenedPath) {
    Write-Info "Verification passed — 'awakened' is in PATH"
    Write-Host ""
    Write-Host "  Run:  awakened          " -ForegroundColor DarkGray -NoNewline; Write-Host "# start the TUI"
    Write-Host "  Run:  awakened --help    " -ForegroundColor DarkGray -NoNewline; Write-Host "# see all commands"
} else {
    Write-Warn "'awakened' not found in PATH. You may need to:"
    Write-Host "  1. Restart your terminal" -ForegroundColor DarkGray
    Write-Host "  2. Or run: cd $Dir; bun link" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Docs: https://github.com/Tlkh201313/awakening-cli-new-gen" -ForegroundColor DarkGray
Write-Host ""
