const API_BASE_URL = getApiBaseUrl();

const transactionForm = document.querySelector("#transactionForm");
const titleInput = document.querySelector("#titleInput");
const amountInput = document.querySelector("#amountInput");
const typeInput = document.querySelector("#typeInput");
const formMessage = document.querySelector("#formMessage");
const transactionList = document.querySelector("#transactionList");
const balanceAmount = document.querySelector("#balanceAmount");
const incomeAmount = document.querySelector("#incomeAmount");
const expenseAmount = document.querySelector("#expenseAmount");
const refreshButton = document.querySelector("#refreshButton");

let transactions = [];

function getApiBaseUrl() {
  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000";
  }

  if (hostname.includes("onrender.com")) {
    return "";
  }

  return "https://nexsoft-expense-tracker.onrender.com";
}

function formatMoney(amount) {
  return `Rs. ${Number(amount).toLocaleString("en-PK")}`;
}

function setMessage(message, type = "info") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function setLoading(isLoading) {
  const submitButton = transactionForm.querySelector(".submit-btn");

  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Saving..." : "Add Transaction";
}

async function fetchTransactions() {
  try {
    setMessage("Loading transactions...", "info");

    const response = await fetch(`${API_BASE_URL}/api/transactions`);

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    transactions = await response.json();

    renderTransactions();
    updateSummaryCards();
    setMessage("", "info");
  } catch {
    transactions = [];
    renderTransactions();
    updateSummaryCards();
    setMessage("Failed to load transactions. Check backend deployment or internet connection.", "error");
  }
}

async function addTransaction(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const type = typeInput.value;

  if (!title || amount <= 0 || !type) {
    setMessage("Please enter valid transaction details.", "error");
    titleInput.focus();
    return;
  }

  setLoading(true);
  setMessage("Saving transaction...", "info");

  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, amount, type })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to add transaction");
    }

    transactionForm.reset();
    typeInput.value = "income";
    titleInput.focus();
    setMessage("Transaction added successfully.", "success");

    await fetchTransactions();
  } catch (error) {
    setMessage(error.message || "Could not add transaction.", "error");
  } finally {
    setLoading(false);
  }
}

async function deleteTransaction(transactionId) {
  const userConfirmed = confirm("Delete this transaction?");

  if (!userConfirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error("Failed to delete transaction");
    }

    setMessage("Transaction deleted successfully.", "success");
    await fetchTransactions();
  } catch {
    setMessage("Could not delete transaction.", "error");
  }
}

function updateSummaryCards() {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  balanceAmount.textContent = formatMoney(totalIncome - totalExpenses);
  incomeAmount.textContent = formatMoney(totalIncome);
  expenseAmount.textContent = formatMoney(totalExpenses);
}

function renderTransactions() {
  transactionList.innerHTML = "";

  if (transactions.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "No transactions yet.";
    transactionList.appendChild(emptyMessage);
    return;
  }

  transactions.forEach((transaction) => {
    transactionList.appendChild(buildTransactionItem(transaction));
  });
}

function buildTransactionItem(transaction) {
  const transactionItem = document.createElement("article");
  transactionItem.className = `transaction-item ${transaction.type}`;

  const transactionInfo = document.createElement("div");
  const transactionTitle = document.createElement("p");
  const transactionMeta = document.createElement("p");
  const transactionActions = document.createElement("div");
  const transactionAmount = document.createElement("p");
  const deleteButton = document.createElement("button");

  const formattedDate = new Date(transaction.date || transaction.createdAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  transactionTitle.className = "transaction-title";
  transactionTitle.textContent = transaction.title;

  transactionMeta.className = "transaction-meta";
  transactionMeta.textContent = `${transaction.type === "income" ? "Income" : "Expense"} • ${formattedDate}`;

  transactionActions.className = "transaction-actions";

  transactionAmount.className = `transaction-amount ${transaction.type}`;
  transactionAmount.textContent = `${transaction.type === "income" ? "+" : "-"} ${formatMoney(Number(transaction.amount))}`;

  deleteButton.className = "delete-btn";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete ${transaction.title}`);
  deleteButton.addEventListener("click", () => deleteTransaction(transaction._id));

  transactionInfo.append(transactionTitle, transactionMeta);
  transactionActions.append(transactionAmount, deleteButton);
  transactionItem.append(transactionInfo, transactionActions);

  return transactionItem;
}

transactionForm.addEventListener("submit", addTransaction);
refreshButton.addEventListener("click", fetchTransactions);
fetchTransactions();