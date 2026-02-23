# dblebox CLI - Claude Code Setup

Copy this message to Claude Code to set up dblebox:

---

## Setup Message for Claude

```
Install and configure the dblebox CLI for thread-based communication:

1. Clone: git clone https://github.com/theashbhat/dblebox-cli.git ~/.dblebox-cli
2. Install deps: cd ~/.dblebox-cli && bun install
3. Create alias: Add to your shell config:
   alias dblebox="bun run ~/.dblebox-cli/src/cli.ts"

Then authenticate:
   dblebox login --email YOUR_EMAIL

After entering the verification code from email, you can use:
- dblebox threads          # list threads
- dblebox new "message"    # create thread
- dblebox comment ID "msg" # reply to thread
- dblebox invite ID user   # add someone
- dblebox archive ID       # archive thread

Thread IDs support short format (first 8 chars).
```

---

## One-Shot Setup Command

For Claude to run directly:

```bash
git clone https://github.com/theashbhat/dblebox-cli.git ~/.dblebox-cli && \
cd ~/.dblebox-cli && bun install && \
mkdir -p ~/.local/bin && \
echo '#!/usr/bin/env bash
exec bun run ~/.dblebox-cli/src/cli.ts "$@"' > ~/.local/bin/dblebox && \
chmod +x ~/.local/bin/dblebox && \
echo "✅ dblebox installed. Run: dblebox login --email you@example.com"
```

---

## MCP Tool Definition (Optional)

If using as an MCP tool, add to your config:

```json
{
  "tools": {
    "dblebox": {
      "command": "bun",
      "args": ["run", "~/.dblebox-cli/src/cli.ts"],
      "description": "Thread-based communication CLI"
    }
  }
}
```

---

## Example Claude Prompts

After setup, you can ask Claude:

- "List my dblebox threads"
- "Create a new dblebox thread about project kickoff"
- "Reply to thread 73e8 with 'Sounds good, let's discuss tomorrow'"
- "Invite @username to my thread about the budget"
- "Snooze thread 73e8 for 1 day"
