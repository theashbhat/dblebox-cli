#!/usr/bin/env bash
set -e

echo "Installing dblebox-cli..."

# Check for bun
if ! command -v bun &> /dev/null; then
  echo "Bun not found. Installing..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

# Clone repo
INSTALL_DIR="$HOME/.dblebox-cli"
if [ -d "$INSTALL_DIR" ]; then
  echo "Updating existing installation..."
  cd "$INSTALL_DIR" && git pull
else
  git clone https://github.com/theashbhat/dblebox-cli.git "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
bun install

# Create wrapper script
mkdir -p "$HOME/.local/bin"
cat > "$HOME/.local/bin/dblebox" << 'WRAPPER'
#!/usr/bin/env bash
exec bun run "$HOME/.dblebox-cli/src/cli.ts" "$@"
WRAPPER
chmod +x "$HOME/.local/bin/dblebox"

# Add to PATH if needed
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc" 2>/dev/null || true
fi

echo ""
echo "✅ dblebox installed!"
echo ""
echo "Run: dblebox login --email you@example.com"
