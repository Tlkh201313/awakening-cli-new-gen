#!/usr/bin/env bash
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────────
MUTED='\033[0;2m'
RED='\033[0;31m'
GREEN='\033[0;32m'
ORANGE='\033[38;5;214m'
NC='\033[0m'

REPO_URL="https://github.com/Tlkh201313/awakening-cli-new-gen.git"
INSTALL_DIR="${AWAKENED_INSTALL_DIR:-$HOME/awakening-cli-new-gen}"

# ── Helpers ─────────────────────────────────────────────────────────────────────
info()    { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${ORANGE}⚠${NC} $1"; }
fail()    { echo -e "${RED}✗${NC} $1"; exit 1; }

usage() {
    cat <<EOF
Awakened CLI — Source Installer

Clones the repo, installs dependencies, and registers the \`awakened\`
command globally via \`bun link\`.

Usage: setup.sh [options]

Options:
    -h, --help              Display this help message
    -d, --dir <path>        Install directory (default: ~/awakening-cli-new-gen)
    -s, --skip-link         Skip global registration (bun link)
    -b, --build             Also build standalone binary (slower, no Bun needed at runtime)

Examples:
    curl -fsSL https://raw.githubusercontent.com/Tlkh201313/awakening-cli-new-gen/dev/setup.sh | bash
    curl -fsSL https://raw.githubusercontent.com/Tlkh201313/awakening-cli-new-gen/dev/setup.sh | bash -s -- --dir ./my-awakened
    ./setup.sh --build
EOF
}

# ── Parse args ──────────────────────────────────────────────────────────────────
skip_link=false
do_build=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)      usage; exit 0 ;;
        -d|--dir)       INSTALL_DIR="$2"; shift 2 ;;
        -s|--skip-link) skip_link=true; shift ;;
        -b|--build)     do_build=true; shift ;;
        *)              warn "Unknown option '$1'"; shift ;;
    esac
done

# ── Step 1: Check / install Bun ────────────────────────────────────────────────
echo ""
echo -e "${MUTED}── Awakened CLI Setup ──────────────────────────────────────${NC}"
echo ""

if command -v bun &>/dev/null; then
    BUN_VERSION=$(bun --version 2>/dev/null || echo "unknown")
    info "Bun found: v${BUN_VERSION}"
else
    warn "Bun not found. Installing..."
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        fail "Please install Bun manually: https://bun.sh/docs/installation"
    fi
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    if command -v bun &>/dev/null; then
        info "Bun installed: v$(bun --version)"
    else
        fail "Bun installation failed. Install manually: https://bun.sh/docs/installation"
    fi
fi

# ── Step 2: Clone or update repo ───────────────────────────────────────────────
echo ""
if [[ -d "$INSTALL_DIR/.git" ]]; then
    info "Repo exists at $INSTALL_DIR — pulling latest..."
    git -C "$INSTALL_DIR" pull --ff-only 2>/dev/null || warn "Pull failed (local changes?). Using existing."
else
    info "Cloning into $INSTALL_DIR ..."
    git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# ── Step 3: Install dependencies + build ───────────────────────────────────────
echo ""
info "Installing dependencies..."
bun install

echo ""
info "Building CLI..."
bun run build

# ── Step 4: Register globally ──────────────────────────────────────────────────
if [[ "$skip_link" == "false" ]]; then
    echo ""
    info "Registering 'awakened' command globally..."
    bun link
    info "Done — 'awakened' is now available globally."
else
    echo ""
    warn "Skipping global registration (--skip-link)."
    info "Run manually: cd $INSTALL_DIR && bun link"
fi

# ── Step 5: Optional build ─────────────────────────────────────────────────────
if [[ "$do_build" == "true" ]]; then
    echo ""
    info "Building standalone binary..."
    bun run build
    info "Binary built in packages/awakened/dist/"
fi

# ── Step 6: Verify ─────────────────────────────────────────────────────────────
echo ""
if command -v awakened &>/dev/null; then
    info "Verification passed — 'awakened' is in PATH"
    echo ""
    echo -e "${MUTED}  Run:${NC}  awakened          ${MUTED}# start the TUI${NC}"
    echo -e "${MUTED}  Run:${NC}  awakened --help    ${MUTED}# see all commands${NC}"
else
    warn "'awakened' not found in PATH. You may need to:"
    echo -e "  ${MUTED}1. Restart your shell${NC}"
    echo -e "  ${MUTED}2. Or run: export PATH=\"\$HOME/.bun/bin:\$PATH\"${NC}"
    echo -e "  ${MUTED}3. Or run: cd $INSTALL_DIR && bun link${NC}"
fi

echo ""
echo -e "${MUTED}Docs: https://github.com/Tlkh201313/awakening-cli-new-gen${NC}"
echo ""
