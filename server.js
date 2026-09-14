const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID, createHmac, timingSafeEqual } = require("node:crypto");
require("dotenv").config();
const { Pool } = require("pg");

const root = path.join(__dirname, "public");
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;
const adminUsername = String(process.env.ADMIN_USERNAME || "").trim();
const adminPassword = String(process.env.ADMIN_PASSWORD || "");
const viewerUsername = String(process.env.VIEWER_USERNAME || "").trim();
const viewerPassword = String(process.env.VIEWER_PASSWORD || "");
const sessionSecret = String(process.env.SESSION_SECRET || "");
const accounts = [];
if (adminUsername && adminPassword) accounts.push({ username: adminUsername, password: adminPassword, name: "Administrator", email: "admin@localhost", role: "ADMIN" });
if (viewerUsername && viewerPassword) accounts.push({ username: viewerUsername, password: viewerPassword, name: "Viewer", email: "viewer@localhost", role: "VIEWER" });
const seedTransactions = [
  { id: "tx-1001", date: "2026-09-14", description: "Client retainer", category: "Sales", amount: 12500000, type: "INCOME", source: "WEB", user: "Aisha Rahman" },
  { id: "tx-1002", date: "2026-09-13", description: "Cloud infrastructure", category: "Operations", amount: 1850000, type: "EXPENSE", source: "TELEGRAM", user: "Rizky Pratama" },
  { id: "tx-1003", date: "2026-09-12", description: "Office supplies", category: "Operations", amount: 475000, type: "EXPENSE", source: "WHATSAPP", user: "Aisha Rahman" },
  { id: "tx-1004", date: "2026-09-11", description: "Design milestone", category: "Sales", amount: 7800000, type: "INCOME", source: "WEB", user: "Maya Sari" },
  { id: "tx-1005", date: "2026-09-10", description: "Team lunch", category: "People", amount: 620000, type: "EXPENSE", source: "WHATSAPP", user: "Rizky Pratama" }
];

const users = [
  { id: "usr-1", name: "Administrator", email: "admin@localhost", role: "ADMIN", status: "ACTIVE", lastActive: "2 min ago" }
];
const categories = new Set(["Sales", "Operations", "People"]);

const bots = [
  { platform: "WhatsApp", status: "DISCONNECTED", detail: "+62 812 4400 8821", processed: 1248, color: "whatsapp" },
  { platform: "Telegram", status: "DISCONNECTED", detail: "@precision_ledger_bot", processed: 864, color: "telegram" },
  { platform: "Web API", status: "CONNECTED", detail: "api.precision.co", processed: 319, color: "web" }
];

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function authenticated(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!sessionSecret || !token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = createHmac("sha256", sessionSecret).update(encodedPayload).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload.username || payload.expiresAt < Date.now()) return null;
    return accounts.find((account) => account.username === payload.username) || null;
  } catch {
    return null;
  }
}

function createSession(account) {
  const payload = Buffer.from(JSON.stringify({ username: account.username, expiresAt: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  const signature = createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

async function ensureDatabase() {
  if (!pool) throw new Error("DATABASE_URL is not configured. Add your Neon connection string to .env.");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      transaction_date DATE NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount BIGINT NOT NULL CHECK (amount > 0),
      type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
      source TEXT NOT NULL,
      user_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const result = await pool.query("SELECT COUNT(*)::int AS count FROM transactions");
  if (result.rows[0].count === 0) {
    for (const transaction of seedTransactions) {
      await pool.query(
        "INSERT INTO transactions (id, transaction_date, description, category, amount, type, source, user_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [transaction.id, transaction.date, transaction.description, transaction.category, transaction.amount, transaction.type, transaction.source, transaction.user]
      );
    }
  }
}

function databaseRequired() {
  return pool ? null : "Database is not configured. Set DATABASE_URL in .env and restart the server.";
}

async function getTransactions() {
  const result = await pool.query("SELECT id, transaction_date::text AS date, description, category, amount::text AS amount, type, source, user_name AS user FROM transactions ORDER BY transaction_date DESC, created_at DESC");
  return result.rows.map((transaction) => ({ ...transaction, amount: Number(transaction.amount) }));
}

async function dashboard() {
  const result = await pool.query("SELECT COALESCE(SUM(amount) FILTER (WHERE type = 'INCOME'), 0)::text AS income, COALESCE(SUM(amount) FILTER (WHERE type = 'EXPENSE'), 0)::text AS expenses, COUNT(*)::int AS count FROM transactions");
  const income = Number(result.rows[0].income);
  const expenses = Number(result.rows[0].expenses);
  return { income, expenses, balance: income - expenses, transactionCount: result.rows[0].count, series: [42, 56, 49, 68, 61, 79, 73, 88, 84, 96, 91, 100] };
}

function body(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error("Request body must be valid JSON")); }
    });
    req.on("error", reject);
  });
}

function serveFile(req, res) {
  const requested = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const file = path.normalize(path.join(root, requested));
  if (!file.startsWith(root)) return json(res, 403, { error: "Forbidden" });
  fs.readFile(file, (error, data) => {
    if (error) return json(res, 404, { error: "Not found" });
    const extension = path.extname(file);
    const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };
    res.writeHead(200, { "Content-Type": types[extension] || "application/octet-stream" });
    res.end(data);
  });
}

async function requestHandler(req, res) {
  await databaseReady;
  if (req.url.startsWith("/api/")) {
    try {
      if (req.method === "POST" && req.url.split("?")[0] === "/api/login") {
        const input = await body(req);
        const account = accounts.find((candidate) => candidate.username === input.username && candidate.password === input.password);
        if (!account) return json(res, 401, { error: "Invalid username or password" });
        if (!sessionSecret) return json(res, 503, { error: "SESSION_SECRET is not configured" });
        const token = createSession(account);
        return json(res, 200, { token, user: { name: account.name, email: account.email, role: account.role, username: account.username } });
      }
      const session = authenticated(req);
      if (!session) return json(res, 401, { error: "Authentication required" });
      if (req.method === "GET" && req.url.split("?")[0] === "/api/dashboard") {
        const error = databaseRequired();
        if (error) return json(res, 503, { error });
        return json(res, 200, await dashboard());
      }
      if (req.method === "GET" && req.url.split("?")[0] === "/api/transactions") {
        const error = databaseRequired();
        if (error) return json(res, 503, { error });
        return json(res, 200, await getTransactions());
      }
      if (req.method === "GET" && req.url.split("?")[0] === "/api/users") return json(res, 200, users.map(({ password, ...user }) => user));
      if (req.method === "GET" && req.url.split("?")[0] === "/api/categories") return json(res, 200, [...categories]);
      if (req.method === "GET" && req.url.split("?")[0] === "/api/bots") return json(res, 200, bots);
      if (req.method === "POST" && req.url.split("?")[0] === "/api/transactions") {
        if (session.role !== "ADMIN") return json(res, 403, { error: "Admin access is required for this action" });
        const databaseError = databaseRequired();
        if (databaseError) return json(res, 503, { error: databaseError });
        const input = await body(req);
        if (!input.description || !Number.isInteger(input.amount) || input.amount <= 0 || !["INCOME", "EXPENSE"].includes(input.type)) {
          return json(res, 400, { error: "description, positive integer amount, and valid type are required" });
        }
        const transaction = {
          id: randomUUID(), date: input.date || new Date().toISOString().slice(0, 10),
          description: input.description, category: input.category || "Uncategorized",
          amount: input.amount, type: input.type, source: "WEB",           user: session.name
        };
        await pool.query(
          "INSERT INTO transactions (id, transaction_date, description, category, amount, type, source, user_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [transaction.id, transaction.date, transaction.description, transaction.category, transaction.amount, transaction.type, transaction.source, transaction.user]
        );
        return json(res, 201, transaction);
      }
      if (req.method === "DELETE" && /^\/api\/transactions\/?$/.test(req.url.split("?")[0])) {
        if (session.role !== "ADMIN") return json(res, 403, { error: "Admin access is required for this action" });
        const databaseError = databaseRequired();
        if (databaseError) return json(res, 503, { error: databaseError });
        const input = await body(req);
        const ids = Array.isArray(input.ids) ? input.ids.filter((id) => typeof id === "string" && id.length > 0) : [];
        if (ids.length === 0) return json(res, 400, { error: "Select at least one transaction" });
        const result = await pool.query("DELETE FROM transactions WHERE id::text = ANY($1::text[]) RETURNING id", [ids]);
        return json(res, 200, { deleted: result.rowCount });
      }
      const botConnectMatch = req.url.split("?")[0].match(/^\/api\/bots\/([^/]+)\/connect\/?$/);
      if (req.method === "POST" && botConnectMatch) {
        if (session.role !== "ADMIN") return json(res, 403, { error: "Admin access is required for this action" });
        const input = await body(req);
        if (!input.credentials && (!input.apiKey || !input.token)) return json(res, 400, { error: "API key or token is required" });
        const platform = decodeURIComponent(botConnectMatch[1]).toLowerCase();
        const bot = bots.find((candidate) => candidate.platform.toLowerCase() === platform);
        if (!bot || !["WhatsApp", "Telegram"].includes(bot.platform)) return json(res, 404, { error: "Bot platform not found" });
        bot.status = "CONNECTED";
        return json(res, 200, { platform: bot.platform, status: bot.status });
      }
      if (req.method === "POST" && req.url.split("?")[0] === "/api/categories") {
        if (session.role !== "ADMIN") return json(res, 403, { error: "Admin access is required for this action" });
        const input = await body(req);
        const name = String(input.name || "").trim();
        if (!name || name.length > 40) return json(res, 400, { error: "Category name must be 1-40 characters" });
        if (categories.has(name)) return json(res, 409, { error: "Category already exists" });
        categories.add(name);
        return json(res, 201, { name });
      }
      if (req.method === "POST" && req.url.split("?")[0] === "/api/users") {
        if (session.role !== "ADMIN") return json(res, 403, { error: "Admin access is required for this action" });
        const input = await body(req);
        const name = String(input.name || "").trim();
        const email = String(input.email || "").trim().toLowerCase();
        const role = input.role === "ADMIN" ? "ADMIN" : "VIEWER";
        if (!name || !email || !email.includes("@") || typeof input.password !== "string" || input.password.length < 8) return json(res, 400, { error: "Name, valid email, and a password of at least 8 characters are required" });
        if (users.some((user) => user.email === email)) return json(res, 409, { error: "A user with this email already exists" });
        const user = { id: randomUUID(), name, email, role, status: "ACTIVE", lastActive: "Just now", password: input.password };
        users.push(user);
        const { password, ...safeUser } = user;
        return json(res, 201, safeUser);
      }
      const userDeleteMatch = req.url.split("?")[0].match(/^\/api\/users\/([^/]+)\/?$/);
      if (req.method === "DELETE" && userDeleteMatch) {
        if (session.role !== "ADMIN") return json(res, 403, { error: "Admin access is required for this action" });
        const index = users.findIndex((user) => user.id === userDeleteMatch[1]);
        if (index === -1) return json(res, 404, { error: "User not found" });
        if (users[index].role === "ADMIN") return json(res, 403, { error: "Administrator accounts cannot be deleted" });
        const [deletedUser] = users.splice(index, 1);
        return json(res, 200, { deleted: deletedUser.id });
      }
      return json(res, 404, { error: "API route not found" });
    } catch (error) {
      return json(res, 400, { error: error.message });
    }
  }
  serveFile(req, res);
}

const port = Number(process.env.PORT) || 3000;
if (!adminUsername || !adminPassword) console.warn("ADMIN_USERNAME and ADMIN_PASSWORD are not configured; administrator login is disabled.");
if (!sessionSecret) console.warn("SESSION_SECRET is not configured; login is disabled.");
const databaseReady = ensureDatabase().catch((error) => {
  console.error(`Database startup failed: ${error.message}`);
});

if (require.main === module) {
  const server = http.createServer(requestHandler);
  databaseReady.then(() => server.listen(port, () => console.log(`BookKeeping running at http://localhost:${port}`)));
}

module.exports = requestHandler;
