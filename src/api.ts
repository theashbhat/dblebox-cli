import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const CONFIG_DIR = join(homedir(), ".dblebox");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const COOKIE_FILE = join(CONFIG_DIR, "cookies.json");

const BASE_URL = "https://app.dblebox.com";

interface Config {
  email?: string;
  userId?: string;
}

interface CookieStore {
  cookies: string[];
  sessionToken?: string;
}

interface User {
  id: string;
  username: string;
  firstname?: string;
  lastname?: string;
  email: string;
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) return {};
  try { return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")); } 
  catch { return {}; }
}

export function saveConfig(config: Config): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadCookies(): CookieStore {
  if (!existsSync(COOKIE_FILE)) return { cookies: [] };
  try { return JSON.parse(readFileSync(COOKIE_FILE, "utf-8")); }
  catch { return { cookies: [] }; }
}

function saveCookies(store: CookieStore): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(COOKIE_FILE, JSON.stringify(store, null, 2));
}

export function clearCookies(): void {
  if (existsSync(COOKIE_FILE)) writeFileSync(COOKIE_FILE, JSON.stringify({ cookies: [] }));
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  const store = loadCookies();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (store.sessionToken) headers["Cookie"] = `session=${store.sessionToken}`;

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  const setCookies = response.headers.getSetCookie?.() || [];
  for (const cookie of setCookies) {
    const match = cookie.match(/session=([^;]+)/);
    if (match) { store.sessionToken = match[1]; saveCookies(store); }
  }
  return response;
}

export async function beginEmailVerification(email: string): Promise<{ success: boolean; verifyId?: string; error?: string }> {
  const response = await request("/api/auth/email/begin", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) return { success: false, error: data.error };
  
  const config = loadConfig();
  config.email = email;
  saveConfig(config);
  return { success: true, verifyId: data.auth_email_verify_id };
}

export async function verifyEmailCode(email: string, code: string, verifyId: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const response = await request("/api/auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ email, code, auth_email_verify_id: verifyId }),
  });
  const data = await response.json();
  if (!response.ok) return { success: false, error: data.error };

  if (data.session_token) {
    const store = loadCookies();
    store.sessionToken = data.session_token;
    saveCookies(store);
  }
  if (data.user) {
    const config = loadConfig();
    config.userId = data.user.id;
    saveConfig(config);
  }
  return { success: true, user: data.user };
}

export async function checkSession(): Promise<{ authenticated: boolean; user?: User }> {
  try {
    const response = await request("/api/secure/threads", { method: "GET" });
    if (!response.ok) return { authenticated: false };
    const data = await response.json();
    return { authenticated: true, user: data.user };
  } catch {
    return { authenticated: false };
  }
}

export async function logout(): Promise<void> {
  await request("/api/logout", { method: "POST" });
  clearCookies();
}

export async function getThreads(options: { archived?: boolean; snoozed?: boolean; all?: boolean } = {}): Promise<any[]> {
  const response = await request("/api/secure/threads");
  const data = await response.json();
  let threads = data.threadWithMember || [];
  
  const now = new Date();
  if (!options.all && !options.archived && !options.snoozed) {
    threads = threads.filter((t: any) => {
      const member = t.member;
      if (member.archived_at) return false;
      if (member.snooze_until && new Date(member.snooze_until) > now) return false;
      return true;
    });
  }
  return threads;
}

export async function getThread(id: string): Promise<any> {
  const response = await request(`/api/secure/thread/${id}`);
  const data = await response.json();
  return data.data || data;
}

export async function createThread(body: string): Promise<any> {
  const config = loadConfig();
  const thread = {
    id: crypto.randomUUID(),
    body,
    created_at: new Date().toISOString(),
    creator_id: config.userId || "",
    deleted_at: null,
    parent_assigned_at: null,
    parent_thread_id: null,
    block_note_id: null
  };
  const response = await request("/api/secure/threads", {
    method: "POST",
    body: JSON.stringify({ thread }),
  });
  return response.json();
}

export async function addComment(threadId: string, body: string): Promise<any> {
  const config = loadConfig();
  const comment = {
    id: crypto.randomUUID(),
    thread_id: threadId,
    body,
    created_at: new Date().toISOString(),
    creator_id: config.userId || "",
    deleted_at: null
  };
  const response = await request("/api/secure/comment", {
    method: "PUT",
    body: JSON.stringify({ commentId: comment.id, threadId, body }),
  });
  return response.json();
}

export async function archiveThread(threadId: string, archive: boolean = true): Promise<any> {
  const response = await request("/api/secure/threads/archive", {
    method: "PUT",
    body: JSON.stringify({ threadId, archived: archive }),
  });
  return response.json();
}

export async function snoozeThread(threadId: string, duration: string): Promise<any> {
  // Parse duration like "1h", "1d", "1w"
  const match = duration.match(/^(\d+)([hdwm])$/);
  if (!match) throw new Error("Invalid duration format. Use: 1h, 1d, 1w, 1m");
  
  const [, num, unit] = match;
  const ms = { h: 3600000, d: 86400000, w: 604800000, m: 2592000000 }[unit]!;
  const snoozeUntil = new Date(Date.now() + parseInt(num) * ms).toISOString();
  
  const response = await request("/api/secure/threads/snooze", {
    method: "PUT",
    body: JSON.stringify({ threadId, snoozeUntil }),
  });
  return response.json();
}

export async function inviteToThread(threadId: string, invitee: string): Promise<any> {
  const response = await request("/api/secure/threads/invite", {
    method: "POST",
    body: JSON.stringify({ thread_id: threadId, invitee }),
  });
  return response.json();
}

export async function uninviteFromThread(threadId: string, memberId: string): Promise<any> {
  const response = await request("/api/secure/threads/uninvite", {
    method: "POST",
    body: JSON.stringify({ thread_id: threadId, member_id: memberId }),
  });
  return response.json();
}
