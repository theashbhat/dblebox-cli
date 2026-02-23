---
name: dblebox
description: CLI for dblebox thread-based communication. Create threads, add comments, invite collaborators, archive and snooze threads.
homepage: https://github.com/theashbhat/dblebox-cli
metadata:
  openclaw:
    emoji: "📬"
    requires:
      bins: ["bun"]
    install:
      - id: "bun"
        kind: "shell"
        command: "curl -fsSL https://bun.sh/install | bash"
        bins: ["bun"]
        label: "Install Bun runtime"
---

# dblebox CLI

Thread-based communication CLI for [dblebox](https://app.dblebox.com).

## Setup

First time only - authenticate with your email:
```bash
cd {baseDir} && bun run src/cli.ts login --email you@example.com
```

Session persists in `~/.dblebox/`.

## Commands

### List threads
```bash
cd {baseDir} && bun run src/cli.ts threads
cd {baseDir} && bun run src/cli.ts threads --all      # include archived/snoozed
```

### View thread
```bash
cd {baseDir} && bun run src/cli.ts thread <id>        # supports short IDs like "73e8"
```

### Create thread
```bash
cd {baseDir} && bun run src/cli.ts new "Your message here"
```

### Add comment
```bash
cd {baseDir} && bun run src/cli.ts comment <threadId> "Your reply"
```

### Invite/tag someone
```bash
cd {baseDir} && bun run src/cli.ts invite <threadId> <username>
```

### Archive thread
```bash
cd {baseDir} && bun run src/cli.ts archive <threadId>
```

### Snooze thread
```bash
cd {baseDir} && bun run src/cli.ts snooze <threadId> 1d   # 1h, 1d, 1w, 1m
```

### Check current user
```bash
cd {baseDir} && bun run src/cli.ts whoami
```

## Notes

- Short thread IDs work (first 8 chars of UUID)
- Session stored in `~/.dblebox/cookies.json`
- Requires email verification on first login
