const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const transactionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const { title, amount, type } = req.body;
    const numericAmount = Number(amount);

    if (!title || !type || !Number.isFinite(numericAmount)) {
      return res.status(400).json({ message: "Title, amount, and type are required" });
    }

    if (numericAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero" });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Type must be income or expense" });
    }

    const transaction = await Transaction.create({
      title,
      amount: numericAmount,
      type
    });

    res.status(201).json(transaction);
  } catch {
    res.status(500).json({ message: "Failed to add transaction" });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!deletedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete transaction" });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();