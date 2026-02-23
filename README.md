# dblebox-cli

Command-line interface for [dblebox](https://app.dblebox.com) - a thread-based communication app.

## Installation

```bash
bun install
bun run build
```

## Usage

### Login

```bash
dblebox login --email you@example.com
# Enter the verification code from your email
```

Session is stored in `~/.dblebox/cookies.json` and persists across sessions.

### Commands

```bash
dblebox whoami                    # Show current user
dblebox threads                   # List active threads
dblebox threads --all             # List all threads (including archived/snoozed)
dblebox threads --archived        # List archived threads
dblebox threads --snoozed         # List snoozed threads
dblebox thread <id>               # View a thread and its comments
dblebox new "message"             # Create a new thread
dblebox comment <threadId> "msg"  # Add a comment to a thread
dblebox archive <threadId>        # Archive a thread
dblebox snooze <threadId> 1d      # Snooze thread (1h, 1d, 1w, 1m)
dblebox logout                    # Log out
```

### Examples

```bash
# Create a new thread
dblebox new "Project kickoff discussion"

# View and reply to a thread
dblebox thread 73e8dee2
dblebox comment 73e8dee2 "Great idea, let's discuss tomorrow"

# Snooze for later
dblebox snooze 73e8dee2 1d
```

## Config

- Session: `~/.dblebox/cookies.json`
- User config: `~/.dblebox/config.json`

## API

Built by reverse-engineering the dblebox web app. Key endpoints:
- `POST /api/auth/email/begin` - Start email verification
- `POST /api/auth/email/verify` - Verify code (needs email + code + auth_email_verify_id)
- `GET /api/secure/threads` - List threads
- `POST /api/secure/threads` - Create thread
- `PUT /api/secure/comment` - Add/update comment
- `PUT /api/secure/threads/archive` - Archive thread
- `PUT /api/secure/threads/snooze` - Snooze thread

### Collaboration

```bash
dblebox invite <threadId> <username>   # Add someone to thread
dblebox tag <threadId> <username>      # Alias for invite
dblebox uninvite <threadId> <username> # Remove from thread
```
