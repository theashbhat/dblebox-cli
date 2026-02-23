#!/usr/bin/env bun
import { Command } from "commander";
import * as readline from "readline";
import * as api from "./api";

const program = new Command();

program.name("dblebox").description("CLI for dblebox").version("1.0.0");

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

program.command("login").description("Login with email")
  .option("-e, --email <email>", "Email address")
  .action(async (options) => {
    const email = options.email || (await prompt("Email: "));
    console.log(`Sending verification code to ${email}...`);
    const beginResult = await api.beginEmailVerification(email);
    if (!beginResult.success) { console.error(`Error: ${beginResult.error}`); process.exit(1); }
    
    console.log("Check your email for the verification code.");
    const code = await prompt("Verification code: ");
    
    const verifyResult = await api.verifyEmailCode(email, code, beginResult.verifyId!);
    if (!verifyResult.success) { console.error(`Error: ${verifyResult.error}`); process.exit(1); }
    console.log(`✓ Logged in as ${verifyResult.user?.username || email}`);
  });

program.command("logout").description("Log out").action(async () => {
  await api.logout();
  console.log("✓ Logged out");
});

program.command("whoami").description("Show current user").action(async () => {
  const session = await api.checkSession();
  if (!session.authenticated) { console.log("Not logged in."); process.exit(1); }
  console.log(`Logged in as: ${session.user?.username}`);
  console.log(`Email: ${session.user?.email}`);
});

program.command("threads").alias("ls").description("List threads")
  .option("-a, --archived", "Show archived")
  .option("-s, --snoozed", "Show snoozed")
  .option("--all", "Show all")
  .action(async (options) => {
    const threads = await api.getThreads(options);
    if (threads.length === 0) { console.log("No threads."); return; }
    for (const item of threads) {
      const thread = item.thread || item;
      const id = (thread.id || "").substring(0, 8);
      const body = (thread.body || "").substring(0, 60).replace(/\n/g, " ");
      console.log(`[${id}] ${body}`);
    }
  });

program.command("thread <id>").alias("view").description("View thread").action(async (id) => {
  const data = await api.getThread(id);
  const thread = data.thread || data;
  console.log("=".repeat(60));
  console.log(thread.body);
  console.log("=".repeat(60));
  const comments = data.thread_comments || [];
  for (const c of comments) {
    console.log(`\n[${c.created_at?.substring(0, 10)}] ${c.body}`);
  }
});

program.command("new <body>").alias("create").description("Create thread").action(async (body) => {
  const result = await api.createThread(body);
  const threadId = result.thread?.id || result.id;
  console.log(`✓ Created: ${threadId?.substring(0, 8)}`);
});

program.command("comment <threadId> <body>").alias("reply").description("Add comment").action(async (threadId, body) => {
  await api.addComment(threadId, body);
  console.log("✓ Comment added");
});

program.command("archive <threadId>").description("Archive thread").action(async (threadId) => {
  await api.archiveThread(threadId, true);
  console.log("✓ Archived");
});

program.command("snooze <threadId> [duration]").description("Snooze (1h, 1d, 1w)").action(async (threadId, duration = "1d") => {
  await api.snoozeThread(threadId, duration);
  console.log(`✓ Snoozed for ${duration}`);
});

program.parse();
