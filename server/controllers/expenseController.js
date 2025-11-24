const Expense = require('../models/Expense');
const Balance = require('../models/Balance');

// GET all expenses
const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });

    const totalExpense = expenses.reduce((sum, item) => {
      return sum + Number(item.amount);
    }, 0);

    res.json({
      totalExpense,
      expenses
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// GET single expense
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST new expense (subtract from current balance)
const createExpense = async (req, res) => {
  const { description, amount, paidBy, date } = req.body;
  try {
    const newExpense = new Expense({ description, amount, paidBy, date });
    await newExpense.save();

    // Update balance (only current)
    const balance = await Balance.findOne();
    if (!balance || balance.currentAmount < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    balance.currentAmount -= amount;
    await balance.save();

    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT update expense (adjust diff in balance)
const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { description, amount, paidBy, date } = req.body;
  try {
    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const amountDiff = amount - expense.amount;
    expense.description = description;
    expense.amount = amount;
    expense.paidBy = paidBy;
    expense.date = date || expense.date;
    await expense.save();

    // Update balance
    const balance = await Balance.findOne();
    if (balance) {
      balance.currentAmount -= amountDiff; // Note: if amount increases, it subtracts more (negative diff)
      if (balance.currentAmount < 0) balance.currentAmount = 0;
      await balance.save();
    }

    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE expense (add back to balance)
const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    await expense.deleteOne();

    // Update balance (add back)
    const balance = await Balance.findOne();
    if (balance) {
      balance.currentAmount += expense.amount;
      await balance.save();
    }

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
};