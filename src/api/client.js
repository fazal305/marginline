async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export const api = {
  getSummary: () => request("/api/summary"),
  getMarginHealth: () => request("/api/margin-health"),
  getMonthlySummary: (months = 6) => request(`/api/summary/monthly?months=${months}`),
  getBreakdown: () => request("/api/summary/breakdown"),
  getCategories: () => request("/api/categories"),
  createCategory: (payload) => request("/api/categories", { method: "POST", body: payload }),
  updateCategory: (id, payload) => request(`/api/categories/${id}`, { method: "PATCH", body: payload }),
  getAccounts: () => request("/api/accounts"),
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
    ).toString();
    return request(`/api/transactions${query ? `?${query}` : ""}`);
  },
  createTransaction: (payload) => request("/api/transactions", { method: "POST", body: payload }),
  updateTransaction: (id, payload) => request(`/api/transactions/${id}`, { method: "PATCH", body: payload }),
  deleteTransaction: (id) => request(`/api/transactions/${id}`, { method: "DELETE" }),
  getBudgets: (month) => request(`/api/budgets?month=${month}`),
  saveBudget: (payload) => request("/api/budgets", { method: "POST", body: payload }),
  deleteBudget: (id) => request(`/api/budgets/${id}`, { method: "DELETE" }),
  getRecurring: () => request("/api/recurring"),
  createRecurring: (payload) => request("/api/recurring", { method: "POST", body: payload }),
  updateRecurring: (id, payload) => request(`/api/recurring/${id}`, { method: "PATCH", body: payload }),
  deleteRecurring: (id) => request(`/api/recurring/${id}`, { method: "DELETE" }),
  getCalendar: (month) => request(`/api/calendar?month=${month}`),
  getEmergencyFund: () => request("/api/emergency-fund"),
  updateEmergencyFund: (payload) => request("/api/emergency-fund", { method: "PATCH", body: payload }),
  getDebts: () => request("/api/debts"),
  createDebt: (payload) => request("/api/debts", { method: "POST", body: payload }),
  updateDebt: (id, payload) => request(`/api/debts/${id}`, { method: "PATCH", body: payload }),
  deleteDebt: (id) => request(`/api/debts/${id}`, { method: "DELETE" }),
  getMomComparison: (month) => request(`/api/reports/mom?month=${month}`),
  getLeaks: (month) => request(`/api/reports/leaks?month=${month}`),
  getMonthlyReview: (month) => request(`/api/reports/monthly-review?month=${month}`),
  getForecast: (month) => request(`/api/reports/forecast?month=${month}`),
  previewImport: (csv) => request("/api/import/preview", { method: "POST", body: { csv } }),
  commitImport: (rows) => request("/api/import/commit", { method: "POST", body: { rows } }),
  getDemoMode: () => request("/api/demo-mode")
};
