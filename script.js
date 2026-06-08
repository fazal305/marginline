const API_BASE_URL = "https://nexsoft-expense-tracker.onrender.com";

const transactionForm = document.getElementById("transactionForm");
const titleInput = document.getElementById("titleInput");
const amountInput = document.getElementById("amountInput");
const typeInput = document.getElementById("typeInput");
const formMessage = document.getElementById("formMessage");
const transactionList = document.getElementById("transactionList");
const balanceAmount = document.getElementById("balanceAmount");
const incomeAmount = document.getElementById("incomeAmount");
const expenseAmount = document.getElementById("expenseAmount");

let transactions = [];

/* Format money for display */
function formatMoney(amount) {
  return `Rs. ${amount.toLocaleString()}`;
}

/* Fetch transactions from MongoDB */
async function fetchTransactions() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`);
    transactions = await response.json();

    renderTransactions();
    updateSummaryCards();
  } catch (error) {
    formMessage.textContent = "Failed to load transactions.";
  }
}

/* Add transaction to MongoDB */
async function addTransaction(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const type = typeInput.value;

  if (!title || amount <= 0 || !type) {
    formMessage.textContent = "Please enter valid transaction details.";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, amount, type }),
    });

    if (!response.ok) {
      throw new Error("Failed to add transaction");
    }

    transactionForm.reset();
    typeInput.value = "income";
    formMessage.textContent = "Transaction added successfully.";

    await fetchTransactions();
  } catch (error) {
    formMessage.textContent = "Could not add transaction.";
  }
}

/* Delete transaction from MongoDB */
async function deleteTransaction(transactionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete transaction");
    }

    formMessage.textContent = "Transaction deleted successfully.";
    await fetchTransactions();
  } catch (error) {
    formMessage.textContent = "Could not delete transaction.";
  }
}

/* Update summary cards */
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

/* Render transaction history */
function renderTransactions() {
  transactionList.innerHTML = "";

  if (transactions.length === 0) {
    transactionList.innerHTML = `<p class="empty-message">No transactions yet.</p>`;
    return;
  }

  transactions.forEach((transaction) => {
    const transactionItem = document.createElement("article");
    transactionItem.className = `transaction-item ${transaction.type}`;

    const formattedDate = new Date(transaction.date).toLocaleDateString();

    transactionItem.innerHTML = `
      <div>
        <p class="transaction-title">${transaction.title}</p>
        <p class="transaction-meta">
          ${transaction.type === "income" ? "Income" : "Expense"} • ${formattedDate}
        </p>
      </div>

      <div class="transaction-actions">
        <p class="transaction-amount ${transaction.type}">
          ${transaction.type === "income" ? "+" : "-"} ${formatMoney(Number(transaction.amount))}
        </p>

        <button class="delete-btn" type="button" data-id="${transaction._id}">
          Delete
        </button>
      </div>
    `;

    transactionList.appendChild(transactionItem);
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      deleteTransaction(button.dataset.id);
    });
  });
}

/* Start app */
transactionForm.addEventListener("submit", addTransaction);
fetchTransactions();