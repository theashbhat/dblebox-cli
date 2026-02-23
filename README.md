# dblebox-cli

Command-line interface for [dblebox](https://app.dblebox.com) - thread-based communication.

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/theashbhat/dblebox-cli/master/install.sh | bash
```

Or manually:
```bash
git clone https://github.com/theashbhat/dblebox-cli.git ~/.dblebox-cli
cd ~/.dblebox-cli && bun install
echo 'alias dblebox="bun run ~/.dblebox-cli/src/cli.ts"' >> ~/.bashrc
source ~/.bashrc
```

## Usage

### Login
```bash
dblebox login --email you@example.com
# Enter the 6-digit code from your email
```

### Commands
```bash
dblebox threads                   # List active threads
dblebox thread <id>               # View thread (supports short IDs like "73e8")
dblebox new "message"             # Create thread
dblebox comment <id> "reply"      # Add comment
dblebox invite <id> <username>    # Add someone to thread
dblebox archive <id>              # Archive thread
dblebox snooze <id> 1d            # Snooze (1h, 1d, 1w)
dblebox whoami                    # Show current user
dblebox logout                    # Clear session
```

### Aliases
- `dblebox ls` → threads
- `dblebox tag` → invite
- `dblebox add` → invite
- `dblebox remove` → uninvite

## Requirements

- [Bun](https://bun.sh) runtime

## Session

Credentials stored in `~/.dblebox/` - persists across sessions.

## License

MIT

## Integration

### OpenClaw / ClawHub
See [SKILL.md](./SKILL.md) for skill integration.

### Claude Code
See [CLAUDE.md](./CLAUDE.md) for single-message setup instructions.
