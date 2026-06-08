const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* Middleware */
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* MongoDB Connection */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

/* Transaction Model */
const transactionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

/* Get All Transactions */
app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

/* Add New Transaction */
app.post("/api/transactions", async (req, res) => {
  try {
    console.log("Received transaction:", req.body);

    const { title, amount, type } = req.body;
    const numericAmount = Number(amount);

    if (!title || !numericAmount || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (numericAmount <= 0) {
      return res.status(400).json({ message: "Amount must be positive" });
    }

    const newTransaction = await Transaction.create({
      title,
      amount: numericAmount,
      type,
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Add transaction error:", error.message);
    res.status(500).json({ message: "Failed to add transaction" });
  }
});

/* Delete Transaction */
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!deletedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete transaction" });
  }
});

/* Server */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});