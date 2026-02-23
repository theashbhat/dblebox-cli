#!/usr/bin/env bun
import { Command } from "commander";
import * as readline from "readline";
import * as api from "./api";

const program = new Command();

program.name("dblebox").description("CLI for dblebox - thread-based communication").version("1.0.0");

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

program.command("login")
  .description("Login with email verification")
  .option("-e, --email <email>", "Email address")
  .action(async (options) => {
    const email = options.email || (await prompt("Email: "));
    
    console.log(`\n📧 Sending verification code to ${email}...`);
    const beginResult = await api.beginEmailVerification(email);
    
    if (!beginResult.success) {
      console.error(`\n❌ Error: ${beginResult.error}`);
      process.exit(1);
    }
    
    console.log(`✅ Code sent! Check your inbox.\n`);
    const code = await prompt("Enter 6-digit code: ");
    
    console.log(`\n🔐 Verifying...`);
    const verifyResult = await api.verifyEmailCode(email, code.trim(), beginResult.verifyId!);
    
    if (!verifyResult.success) {
      console.error(`\n❌ Error: ${verifyResult.error}`);
      process.exit(1);
    }
    
    console.log(`\n✅ Logged in as ${verifyResult.user?.username || email}`);
    console.log(`   Session saved to ~/.dblebox/\n`);
  });

program.command("logout")
  .description("Log out and clear session")
  .action(async () => {
    await api.logout();
    console.log("✅ Logged out. Session cleared.");
  });

program.command("whoami")
  .description("Show current user")
  .action(async () => {
    const session = await api.checkSession();
    if (!session.authenticated) {
      console.log("❌ Not logged in. Run: dblebox login");
      process.exit(1);
    }
    console.log(`👤 ${session.user?.username}`);
    console.log(`📧 ${session.user?.email}`);
  });

program.command("threads")
  .alias("ls")
  .description("List threads")
  .option("-a, --archived", "Include archived")
  .option("-s, --snoozed", "Include snoozed")
  .option("--all", "Show all threads")
  .action(async (options) => {
    const threads = await api.getThreads(options);
    if (threads.length === 0) {
      console.log("📭 No threads.");
      return;
    }
    console.log("");
    for (const item of threads) {
      const thread = item.thread || item;
      const member = item.member;
      const id = (thread.id || "").substring(0, 8);
      const body = (thread.body || "").substring(0, 55).replace(/\n/g, " ");
      const flags = [];
      if (member?.archived_at) flags.push("📦");
      if (member?.snooze_until && new Date(member.snooze_until) > new Date()) flags.push("💤");
      console.log(`  ${id}  ${body}${body.length > 55 ? "…" : ""}  ${flags.join("")}`);
    }
    console.log("");
  });

program.command("thread <id>")
  .alias("view")
  .description("View thread and comments")
  .action(async (id) => {
    // Support short IDs
    if (id.length < 36) {
      const threads = await api.getThreads({ all: true });
      const match = threads.find((t: any) => (t.thread?.id || t.id || "").startsWith(id));
      if (match) id = match.thread?.id || match.id;
    }
    
    const data = await api.getThread(id);
    const thread = data.thread || data;
    
    console.log("\n" + "─".repeat(60));
    console.log(thread.body);
    console.log("─".repeat(60));
    
    const comments = data.thread_comments || [];
    if (comments.length > 0) {
      console.log("\n💬 Comments:\n");
      for (const c of comments) {
        if (c.deleted_at) continue;
        const date = c.created_at?.substring(0, 10) || "";
        console.log(`  [${date}] ${c.body}`);
      }
    }
    console.log("");
  });

program.command("new <body...>")
  .alias("create")
  .description("Create new thread")
  .action(async (bodyParts) => {
    const body = bodyParts.join(" ");
    const result = await api.createThread(body);
    const threadId = result.thread?.id || result.id;
    console.log(`✅ Created thread: ${threadId?.substring(0, 8)}`);
  });

program.command("comment <threadId> <body...>")
  .alias("reply")
  .description("Add comment to thread")
  .action(async (threadId, bodyParts) => {
    // Support short IDs
    if (threadId.length < 36) {
      const threads = await api.getThreads({ all: true });
      const match = threads.find((t: any) => (t.thread?.id || t.id || "").startsWith(threadId));
      if (match) threadId = match.thread?.id || match.id;
    }
    
    const body = bodyParts.join(" ");
    await api.addComment(threadId, body);
    console.log("✅ Comment added");
  });

program.command("archive <threadId>")
  .description("Archive thread")
  .action(async (threadId) => {
    if (threadId.length < 36) {
      const threads = await api.getThreads({ all: true });
      const match = threads.find((t: any) => (t.thread?.id || t.id || "").startsWith(threadId));
      if (match) threadId = match.thread?.id || match.id;
    }
    await api.archiveThread(threadId, true);
    console.log("📦 Thread archived");
  });

program.command("unarchive <threadId>")
  .description("Unarchive thread")
  .action(async (threadId) => {
    if (threadId.length < 36) {
      const threads = await api.getThreads({ all: true });
      const match = threads.find((t: any) => (t.thread?.id || t.id || "").startsWith(threadId));
      if (match) threadId = match.thread?.id || match.id;
    }
    await api.archiveThread(threadId, false);
    console.log("📤 Thread unarchived");
  });

program.command("snooze <threadId> [duration]")
  .description("Snooze thread (1h, 1d, 1w, 1m)")
  .action(async (threadId, duration = "1d") => {
    if (threadId.length < 36) {
      const threads = await api.getThreads({ all: true });
      const match = threads.find((t: any) => (t.thread?.id || t.id || "").startsWith(threadId));
      if (match) threadId = match.thread?.id || match.id;
    }
    await api.snoozeThread(threadId, duration);
    console.log(`💤 Snoozed for ${duration}`);
  });


program.command("invite <threadId> <username>")
  .alias("add")
  .alias("tag")
  .description("Invite/tag someone to a thread")
  .action(async (threadId, username) => {
    // Support short IDs
    if (threadId.length < 36) {
      const threads = await api.getThreads({ all: true });
      const match = threads.find((t: any) => (t.thread?.id || t.id || "").startsWith(threadId));
      if (match) threadId = match.thread?.id || match.id;
    }
    
    try {
      await api.inviteToThread(threadId, username);
      console.log(`✅ Invited @${username} to thread`);
    } catch (e: any) {
      console.error(`❌ Failed to invite: ${e.message || e}`);
      process.exit(1);
    }
  });

program.command("uninvite <threadId> <username>")
  .alias("remove")
  .description("Remove someone from a thread")
  .action(async (threadId, username) => {
    if (threadId.length < 36) {
      const threads = await api.getThreads({ all: true });
      const match = threads.find((t: any) => (t.thread?.id || t.id || "").startsWith(threadId));
      if (match) threadId = match.thread?.id || match.id;
    }
    
    try {
      await api.uninviteFromThread(threadId, username);
      console.log(`✅ Removed @${username} from thread`);
    } catch (e: any) {
      console.error(`❌ Failed to remove: ${e.message || e}`);
      process.exit(1);
    }
  });


program.parse();
