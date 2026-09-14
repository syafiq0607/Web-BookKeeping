const app = document.querySelector("#app");
const title = document.querySelector("#page-title");
const money = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const amountInput = (value) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(value) || 0);
const dateDisplay = (value) => {
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? `${day}-${month}-${year}` : String(value);
};
const state = { transactions: [], users: [], bots: [], categories: [], dashboard: null, view: "overview", user: null, token: null, selectionMode: false };

function isAdmin() {
  return state.user?.role === "ADMIN";
}

function apiFetch(resource, options = {}) {
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${state.token}` };
  return fetch(`/api/${resource}`, { ...options, headers });
}

async function load() {
  await refreshData();
  render(state.view);
}

async function refreshData() {
  const [dashboard, transactions, users, bots, categories] = await Promise.all(["dashboard", "transactions", "users", "bots", "categories"].map((resource) => apiFetch(resource).then(async (response) => {
    if (!response.ok) throw new Error("Could not load workspace data");
    return response.json();
  })));
  Object.assign(state, { dashboard, transactions, users, bots, categories });
}

function showWorkspace(user, token) {
  state.user = user;
  state.token = token;
  localStorage.setItem("bookkeeping-session", JSON.stringify({ user, token }));
  document.body.classList.remove("logged-out");
  document.querySelector("#profile-name").textContent = user.name;
  document.querySelector("#profile-email").textContent = user.email;
  document.querySelector("#profile-role").textContent = user.role === "ADMIN" ? "Administrator · Full control" : "Viewer · Read only";
  document.querySelector("#profile-button").textContent = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  load().catch((error) => showToast(error.message));
}

function showLogin() {
  localStorage.removeItem("bookkeeping-session");
  state.user = null;
  state.token = null;
  document.body.classList.add("logged-out");
  document.querySelector("#profile-menu").classList.remove("open");
  document.querySelector("#login-username").focus();
}

function shell(heading, sub, content, action = "") {
  return `<div class="welcome"><div><span class="eyebrow">LIVE OPERATIONS</span><h2>${heading}</h2><p class="subtle">${sub}</p></div>${action}</div>${content}`;
}

function adminAction(action, label) {
  return isAdmin() ? `<button class="button" data-action="${action}">${label}</button>` : `<span class="read-only-note">View only access</span>`;
}

function cashflowSeries() {
  const byDate = new Map();
  state.transactions.forEach((transaction) => {
    const date = String(transaction.date).slice(0, 10);
    const point = byDate.get(date) || { income: 0, expenses: 0 };
    if (transaction.type === "INCOME") point.income += transaction.amount;
    else point.expenses += transaction.amount;
    byDate.set(date, point);
  });
  const latest = state.transactions.reduce((max, transaction) => {
    const date = String(transaction.date).slice(0, 10);
    return date > max ? date : max;
  }, new Date().toISOString().slice(0, 10));
  const end = new Date(`${latest}T00:00:00Z`);
  const points = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    const values = byDate.get(key) || { income: 0, expenses: 0 };
    points.push({ date: key, income: values.income, expenses: values.expenses });
  }
  const maximum = Math.max(...points.flatMap((point) => [point.income, point.expenses]), 1);
  return points.map((point) => ({
    ...point,
    incomeHeight: Math.round(point.income / maximum * 100),
    expenseHeight: Math.round(point.expenses / maximum * 100),
    net: point.income - point.expenses
  }));
}

function cashflowSummary(series) {
  const current = series.reduce((totals, point) => ({
    income: totals.income + point.income,
    expenses: totals.expenses + point.expenses
  }), { income: 0, expenses: 0 });
  const end = new Date(`${series[0].date}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 11);
  const previous = state.transactions.reduce((totals, transaction) => {
    const date = new Date(`${String(transaction.date).slice(0, 10)}T00:00:00Z`);
    if (date < start || date > end) return totals;
    const key = transaction.type === "INCOME" ? "income" : "expenses";
    totals[key] += transaction.amount;
    return totals;
  }, { income: 0, expenses: 0 });
  return { current, previous };
}

function trendText(current, previous, label) {
  if (current === previous) return `— 0% ${label}`;
  const percentage = previous === 0 ? 100 : Math.round(Math.abs((current - previous) / previous) * 100);
  return `${current > previous ? "↑" : "↓"} ${percentage}% ${label}`;
}

function overview() {
  const series = cashflowSeries();
  const summary = cashflowSummary(series);
  const income = summary.current.income;
  const expenses = summary.current.expenses;
  const balance = income - expenses;
  const transactionCount = state.transactions.length;
  const activity = state.transactions.slice(0, 4).map((t) => `<div class="activity-row"><span class="source ${t.source}">${t.source}</span><div class="desc"><b>${t.description}</b><small>${t.category} · ${dateDisplay(t.date)}</small></div><strong class="${t.type === "INCOME" ? "positive" : "negative"}">${t.type === "INCOME" ? "+" : "-"}${money(t.amount)}</strong></div>`).join("");
  const chart = series.map((point) => `<div class="cashflow-column" title="${dateDisplay(point.date)} · Income ${money(point.income)} · Expenses ${money(point.expenses)}"><div class="cashflow-bars"><span class="cashflow-bar income-bar" style="height:${point.incomeHeight}%"></span><span class="cashflow-bar expense-bar" style="height:${point.expenseHeight}%"></span></div><small>${dateDisplay(point.date)}</small></div>`).join("");
  const periodNet = series.reduce((sum, point) => sum + point.net, 0);
  return shell(`Good afternoon, ${state.user.name.split(" ")[0]}`, "A clear view of your financial operations across every channel.", `<div class="metrics"><div class="card"><span class="metric-label">Available balance</span><div class="metric-value ${balance >= 0 ? "positive" : "negative"}">${money(balance)}</div><span class="metric-trend">Live from cashflow</span></div><div class="card"><span class="metric-label">Total income</span><div class="metric-value">${money(income)}</div><span class="metric-trend positive">Live from cashflow</span></div><div class="card"><span class="metric-label">Total expenses</span><div class="metric-value negative">${money(expenses)}</div><span class="metric-trend negative">Live from cashflow</span></div><div class="card"><span class="metric-label">Transactions</span><div class="metric-value">${transactionCount}</div><span class="metric-trend">Live from cashflow ledger</span></div></div><div class="grid-2"><div class="card cashflow-card"><div class="card-header"><div><h3>Cashflow performance</h3><span>Live transaction movement · latest 12 days</span></div><strong class="${periodNet >= 0 ? "positive" : "negative"}">${periodNet >= 0 ? "+" : ""}${money(periodNet)}</strong></div><div class="chart cashflow-chart">${chart}</div><div class="legend"><span><i class="dot"></i>Income</span><span><i class="dot expense-dot"></i>Expenses</span><span class="chart-updated">Live · synced from cashflow</span></div></div><div class="card"><div class="card-header"><h3>Recent activity</h3><button class="text-button" data-action="view-ledger">View all →</button></div><div class="activity">${activity}</div></div></div>`);
}

function ledger() {
  const selectedCount = document.querySelectorAll(".transaction-check:checked").length;
  const selectionButton = isAdmin() ? `<button class="button ${state.selectionMode && selectedCount ? "danger-button" : "secondary"}" data-action="${state.selectionMode ? (selectedCount ? "delete-transactions" : "cancel-selection") : "select-transactions"}">${state.selectionMode ? (selectedCount ? "Delete selected" : "Cancel") : "Select"}</button>` : "";
  const tools = `<div class="page-tools"><input class="search" placeholder="Search transactions..." id="transaction-search"><div class="cashflow-actions">${adminAction("add-transaction", "+ Add transaction")}<button class="button secondary" data-action="export-csv">Export CSV</button><button class="button secondary" data-action="export-xls">Export XLS</button>${selectionButton}</div></div>`;
  const rows = state.transactions.map((t) => `<tr>${state.selectionMode ? `<td><input class="transaction-check" type="checkbox" value="${t.id}" aria-label="Select ${t.description}"></td>` : ""}<td>${dateDisplay(t.date)}</td><td><b>${t.description}</b><small class="subtle">${t.user}</small></td><td>${t.category}</td><td><span class="source ${t.source}">${t.source}</span></td><td class="${t.type === "INCOME" ? "positive" : "negative"}">${t.type === "INCOME" ? "+" : "-"}${money(t.amount)}</td></tr>`).join("");
  const selectHeader = state.selectionMode ? "<th><input id=\"select-all-transactions\" type=\"checkbox\" aria-label=\"Select all transactions\"></th>" : "";
  return shell("Cashflow ledger", "Every transaction, reconciled and traceable.", `${tools}<div class="card table-card"><div class="table-wrap"><table><thead><tr>${selectHeader}<th>Date</th><th>Description</th><th>Category</th><th>Source</th><th>Amount</th></tr></thead><tbody id="transaction-rows">${rows}</tbody></table></div></div>`);
}

function botsView() {
  const cards = state.bots.map((b) => {
    const name = b.platform === "WhatsApp" ? "WA" : b.platform === "Telegram" ? "Tele" : "Web API";
    return `<div class="card bot-card"><div class="bot-icon ${b.color}">${b.platform === "WhatsApp" ? "◉" : b.platform === "Telegram" ? "➤" : "⌁"}</div><h3>${name}</h3><p>${b.detail}</p><div class="card-footer"><span class="positive">● <span data-bot-status="${b.platform}">${b.status}</span></span>${isAdmin() && b.platform !== "Web API" ? `<button class="text-button" data-action="connect-bot" data-platform="${b.platform}">${b.status === "CONNECTED" ? "Reconnect" : "Connect"}</button>` : `<span class="read-only-note">${isAdmin() ? "Read only" : "Read only"}</span>`}</div></div>`;
  }).join("");
  return shell("Bots", "Connect WA and Tele with live API credentials.", `<div class="bot-grid">${cards}</div><div class="card table-card"><div class="card-header"><h3>Queue health</h3><button class="text-button" data-action="refresh-queue">Updated just now ↻</button></div><div class="activity"><div class="activity-row"><span class="source TELEGRAM">QUEUE</span><div class="desc"><b>Transaction processing</b><small>All workers responding normally</small></div><strong class="positive">12 jobs</strong></div></div></div>`);
}

function usersView() {
  return shell("Users", "Manage roles and keep a complete audit trail of workspace activity.", `<div class="page-tools"><input class="search" placeholder="Search users..." id="user-search">${adminAction("invite-user", "+ Invite user")}</div><div class="card table-card"><div class="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last active</th><th></th></tr></thead><tbody id="user-rows">${state.users.map((u) => `<tr><td><b>${u.name}</b><small class="subtle">${u.email}</small></td><td><span class="source WEB">${u.role}</span></td><td><span class="status ${u.role === "VIEWER" ? "viewer" : ""}">${u.status}</span></td><td>${u.lastActive}</td><td>${isAdmin() && u.role !== "ADMIN" ? `<button class="row-action" data-action="user-menu" data-user-id="${u.id}" aria-label="Open user actions">•••</button>` : `<span class="read-only-note">${u.role === "ADMIN" ? "Protected" : "—"}</span>`}</td></tr>`).join("")}</tbody></table></div></div>`);
}

function categories() {
  const counts = state.categories.map((category) => ({ category, count: state.transactions.filter((t) => t.category === category).length }));
  return shell("Categories", "Classify every transaction consistently across web and bot channels.", `<div class="metrics">${counts.map((c) => `<div class="card category-card"><span class="metric-label">CATEGORY</span><div class="metric-value">${c.category}</div><span class="metric-trend">${c.count} transactions</span></div>`).join("")}</div>`, adminAction("add-category", "+ Add category"));
}

function render(view) {
  const pages = { overview: ["Executive overview", overview], cashflow: ["Cashflow ledger", ledger], bots: ["Bots", botsView], users: ["Users", usersView], categories: ["Categories", categories] };
  state.view = view;
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  title.textContent = pages[view][0];
  app.innerHTML = pages[view][1]();
  app.classList.remove("page-enter");
  requestAnimationFrame(() => app.classList.add("page-enter"));
  if (view === "cashflow") wireSearch("#transaction-search", "#transaction-rows tr");
  if (view === "users") wireSearch("#user-search", "#user-rows tr");
  if (view === "cashflow") {
    document.querySelector("#select-all-transactions")?.addEventListener("change", (event) => {
      document.querySelectorAll(".transaction-check").forEach((checkbox) => { checkbox.checked = event.target.checked; });
      updateSelectionButton();
    });
  }
}

function updateSelectionButton() {
  const button = document.querySelector('[data-action="select-transactions"], [data-action="cancel-selection"], [data-action="delete-transactions"]');
  if (!button || !state.selectionMode) return;
  const selectedCount = document.querySelectorAll(".transaction-check:checked").length;
  button.dataset.action = selectedCount ? "delete-transactions" : "cancel-selection";
  button.textContent = selectedCount ? "Delete selected" : "Cancel";
  button.classList.toggle("danger-button", selectedCount > 0);
  button.classList.toggle("secondary", selectedCount === 0);
}

function wireSearch(inputSelector, rowSelector) {
  document.querySelector(inputSelector).addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll(rowSelector).forEach((row) => { row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none"; });
  });
}

function exportTransactions(format) {
  const headers = ["Date", "Description", "Category", "Source", "Amount", "Type", "User"];
  const rows = state.transactions.map((transaction) => [dateDisplay(transaction.date), transaction.description, transaction.category, transaction.source, transaction.amount, transaction.type, transaction.user]);
  const escapeCell = (value) => `"${String(value).replace(/"/g, "\"\"")}"`;
  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob([format === "xls" ? `\ufeff<table><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>${rows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character]))}</td>`).join("")}</tr>`).join("")}</table>` : `\ufeff${csv}`], { type: format === "xls" ? "application/vnd.ms-excel" : "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `bookkeeping-transactions-${new Date().toISOString().slice(0, 10)}.${format}`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast(`${format.toUpperCase()} export started`);
}

async function deleteSelectedTransactions() {
  if (!isAdmin()) return showToast("Admin access is required");
  const ids = [...document.querySelectorAll(".transaction-check:checked")].map((checkbox) => checkbox.value);
  if (ids.length === 0) return showToast("Select at least one transaction");
  if (!confirm(`Delete ${ids.length} selected transaction${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
  try {
    const response = await apiFetch("transactions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not delete transactions");
    await refreshData();
    state.selectionMode = false;
    render("cashflow");
    showToast(`${result.deleted} transaction${result.deleted === 1 ? "" : "s"} deleted`);
  } catch (error) {
    showToast(error.message);
  }
}

function addTransaction() {
  if (!isAdmin()) return showToast("Admin access is required");
  openModal("transaction");
}

function openModal(kind) {
  const config = {
    transaction: {
      title: "Add transaction", submit: "Save transaction", endpoint: "transactions",
      fields: `<label>Description<input name="description" required maxlength="80" placeholder="e.g. Client payment"></label><label>Amount (IDR)<input name="amount" inputmode="numeric" pattern="[0-9.]*" required value="40.000"></label><label>Type<select name="type"><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></select></label><label>Category<select name="category" required>${state.categories.map((category) => `<option value="${category}">${category}</option>`).join("")}</select></label>`
    },
    category: {
      title: "Create category", submit: "Create category", endpoint: "categories",
      fields: `<label>Category name<input name="name" required maxlength="40" placeholder="e.g. Marketing"></label>`
    },
    user: {
      title: "Add user", submit: "Create user", endpoint: "users",
      fields: `<label>Full name<input name="name" required maxlength="80" placeholder="e.g. Jordan Lee"></label><label>Email<input name="email" type="email" required placeholder="jordan@company.com"></label><label>Password<input name="password" type="password" minlength="8" required placeholder="At least 8 characters"></label><label>Role<select name="role"><option value="VIEWER">Viewer</option><option value="ADMIN">Admin</option></select></label>`
    },
    bot: {
      title: "Connect bot", submit: "Connect", endpoint: "bots",
      fields: `<label>API key / Token<input name="credentials" required type="password" placeholder="Paste API key or token"></label>`
    }
  }[kind];
  const form = document.querySelector("#action-form");
  form.dataset.kind = kind;
  document.querySelector("#modal-title").textContent = config.title;
  document.querySelector("#modal-submit").textContent = config.submit;
  document.querySelector("#modal-submit").classList.remove("danger-button");
  document.querySelector("#modal-fields").innerHTML = config.fields;
  document.querySelector("#modal-error").textContent = "";
  document.querySelector("#modal-backdrop").classList.add("open");
  form.querySelector("input").focus();
  const amount = form.querySelector('input[name="amount"]');
  amount?.addEventListener("input", (event) => {
    const digits = event.target.value.replace(/\D/g, "");
    event.target.value = digits ? amountInput(digits) : "";
  });
}

function closeModal() {
  document.querySelector("#modal-backdrop").classList.remove("open");
}

function showUserDetails(userId) {
  const user = state.users.find((candidate) => candidate.id === userId);
  if (!user) return showToast("User not found");
  const fields = document.querySelector("#modal-fields");
  document.querySelector("#modal-title").textContent = "User information";
  document.querySelector("#modal-submit").textContent = "Delete user";
  document.querySelector("#modal-submit").classList.add("danger-button");
  document.querySelector("#modal-error").textContent = "";
  fields.innerHTML = `<div class="user-detail-list"><div><span>User ID</span><b>${user.id}</b></div><div><span>Full name</span><b>${user.name}</b></div><div><span>Email</span><b>${user.email}</b></div><div><span>Role</span><b>${user.role}</b></div><div><span>Status</span><b>${user.status}</b></div><div><span>Last active</span><b>${user.lastActive}</b></div></div>`;
  const form = document.querySelector("#action-form");
  form.dataset.kind = "user-details";
  form.dataset.userId = user.id;
  document.querySelector("#modal-backdrop").classList.add("open");
}

async function submitModal(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const kind = form.dataset.kind;
  if (kind === "bot") {
    const response = await apiFetch(`bots/${encodeURIComponent(form.dataset.platform)}/connect`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
    const result = await response.json();
    if (!response.ok) {
      document.querySelector("#modal-error").textContent = result.error || "Could not connect bot";
      return;
    }
    closeModal();
    await refreshData();
    render("bots");
    return showToast(`${form.dataset.platform} connected`);
  }
  if (kind === "user-details") {
    const user = state.users.find((candidate) => candidate.id === form.dataset.userId);
    if (!user || user.role === "ADMIN") return showToast("Administrator accounts cannot be deleted");
    if (!confirm(`Delete ${user.name}? This action cannot be undone.`)) return;
    const response = await apiFetch(`users/${user.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) return (document.querySelector("#modal-error").textContent = result.error || "Could not delete user");
    closeModal();
    await load();
    render("users");
    return showToast("User deleted");
  }
  const payload = Object.fromEntries(new FormData(form).entries());
  if (kind === "transaction") payload.amount = Number(String(payload.amount).replace(/\D/g, ""));
  const submit = document.querySelector("#modal-submit");
  const error = document.querySelector("#modal-error");
  submit.disabled = true;
  error.textContent = "";
  try {
    const response = await apiFetch({ transaction: "transactions", category: "categories", user: "users" }[kind], {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save changes");
    closeModal();
    await refreshData();
    render(kind === "transaction" ? "cashflow" : kind === "user" ? "users" : "categories");
    showToast(kind === "transaction" ? "Transaction recorded" : kind === "category" ? "Category created" : "User created");
  } catch (errorValue) {
    error.textContent = errorValue.message;
  } finally {
    submit.disabled = false;
  }
}

function legacyAddTransaction() {
  const description = prompt("Transaction description");
  if (!description) return;
  const amount = Number(prompt("Amount in IDR"));
  if (!Number.isInteger(amount) || amount <= 0) return showToast("Enter a valid whole-number amount");
  apiFetch("transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description, amount, type: "EXPENSE", category: "Operations" }) })
    .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not save transaction"); return result; })
    .then((transaction) => {
      state.transactions.unshift(transaction);
      state.dashboard = { ...state.dashboard, expenses: state.dashboard.expenses + amount, balance: state.dashboard.balance - amount, transactionCount: state.dashboard.transactionCount + 1 };
      render(state.view);
      showToast("Transaction recorded");
    })
    .catch((error) => showToast(error.message));
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function focusSearch() {
  const search = document.querySelector(".search");
  if (search) { search.focus(); search.scrollIntoView({ behavior: "smooth", block: "center" }); return showToast("Search is ready"); }
  render("cashflow");
  setTimeout(() => document.querySelector("#transaction-search")?.focus(), 250);
}

function handleAction(action, element) {
  if (action === "add-transaction") return addTransaction();
  if (action === "export-csv") return exportTransactions("csv");
  if (action === "export-xls") return exportTransactions("xls");
  if (action === "delete-transactions") return deleteSelectedTransactions();
  if (action === "select-transactions") {
    state.selectionMode = true;
    return render("cashflow");
  }
  if (action === "cancel-selection") {
    state.selectionMode = false;
    return render("cashflow");
  }
  if (action === "view-ledger") return render("cashflow");
  if (action === "period") return showToast("Showing the last 12 months");
  if (action === "invite-user") { if (!isAdmin()) return showToast("Admin access is required"); return openModal("user"); }
  if (action === "add-category") { if (!isAdmin()) return showToast("Admin access is required"); return openModal("category"); }
  if (action === "user-menu") return showUserDetails(element.dataset.userId);
  if (action === "connect-bot") {
    if (!isAdmin()) return showToast("Admin access is required");
    openModal("bot");
    document.querySelector("#action-form").dataset.platform = element.dataset.platform;
    return;
  }
  if (action === "refresh-queue") return showToast("Queue health refreshed");
}

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.querySelector("#login-error");
  error.textContent = "";
  try {
    const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: document.querySelector("#login-username").value.trim(), password: document.querySelector("#login-password").value }) });
    const result = (response.headers.get("content-type") || "").includes("application/json")
      ? await response.json()
      : { error: `Login service returned an unexpected response (HTTP ${response.status})` };
    if (!response.ok) throw new Error(result.error || "Unable to sign in");
    showWorkspace(result.user, result.token);
  } catch (loginError) {
    error.textContent = loginError.message;
  }
});
document.querySelector("#nav").addEventListener("click", (event) => { const item = event.target.closest(".nav-item"); if (item) render(item.dataset.view); });
document.addEventListener("click", (event) => { const actionElement = event.target.closest("[data-action]"); if (actionElement) handleAction(actionElement.dataset.action, actionElement); });
document.addEventListener("change", (event) => { if (event.target.matches(".transaction-check")) updateSelectionButton(); });
document.querySelector("#collapse").addEventListener("click", (event) => { const collapsed = document.querySelector("#sidebar").classList.toggle("collapsed"); document.querySelector(".main").classList.toggle("collapsed"); event.currentTarget.textContent = collapsed ? ">" : "<"; event.currentTarget.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar"); showToast("Sidebar layout updated"); });
document.querySelector("#global-search").addEventListener("click", focusSearch);
document.querySelector("#theme-toggle").addEventListener("click", () => { document.body.classList.toggle("calm-mode"); showToast(document.body.classList.contains("calm-mode") ? "Calm contrast enabled" : "Full contrast enabled"); });
document.querySelector("#profile-button").addEventListener("click", () => document.querySelector("#profile-menu").classList.toggle("open"));
document.querySelector("#logout-button").addEventListener("click", showLogin);
document.querySelector("#action-form").addEventListener("submit", submitModal);
document.querySelector("#modal-close").addEventListener("click", closeModal);
document.querySelector("#modal-backdrop").addEventListener("click", (event) => { if (event.target.id === "modal-backdrop") closeModal(); });
document.querySelector("#action-form").addEventListener("reset", () => document.querySelector("#modal-submit").classList.remove("danger-button"));
document.addEventListener("click", (event) => { if (!event.target.closest(".top-actions")) document.querySelector("#profile-menu").classList.remove("open"); });

const savedSession = JSON.parse(localStorage.getItem("bookkeeping-session") || "null");
if (savedSession?.token && savedSession?.user) showWorkspace(savedSession.user, savedSession.token);
else showLogin();

setInterval(() => {
  if (!state.token) return;
  refreshData().then(() => {
    if (state.view === "overview") render("overview");
  }).catch((error) => console.error("Cashflow refresh failed:", error));
}, 15000);
