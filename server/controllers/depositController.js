const Deposit= require('../models/Deposit');
const Balance = require('../models/Balance');

// GET all deposits
const getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ date: -1 });
    const totalAmount = deposits.reduce((sum, item) => sum + Number(item.amount), 0);

    res.json({ deposits, totalAmount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    res.json(deposit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createDeposit = async (req, res) => {
  try {
    const { name, amount, date } = req.body;
    if (!name || !amount) return res.status(400).json({ message: "Name and amount required" });

    const amountNumber = Number(amount);
    if (isNaN(amountNumber) || amountNumber <= 0)
      return res.status(400).json({ message: "Valid positive amount required" });

    const newDeposit = await Deposit.create({
      name,
      amount: amountNumber,
      date: date || new Date(),
    });

    let balance = await Balance.findOne();
    if (!balance) {
      balance = new Balance({ capitalAmount: amountNumber, currentAmount: amountNumber });
    } else {
      balance.capitalAmount += amountNumber;
      balance.currentAmount += amountNumber;
    }
    await balance.save();

    res.status(201).json(newDeposit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const updateDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: "Deposit not found" });

    const oldAmount = Number(deposit.amount);
    const newAmount = Number(req.body.amount);

    if (isNaN(newAmount) || newAmount <= 0)
      return res.status(400).json({ message: "Valid amount required" });

    const difference = newAmount - oldAmount;

    deposit.name = req.body.name || deposit.name;
    deposit.amount = newAmount;
    deposit.date = req.body.date || deposit.date;
    await deposit.save();

    const balance = await Balance.findOne();
    if (balance) {
      balance.capitalAmount += difference;
      balance.currentAmount += difference;
      await balance.save();
    }

    res.json(deposit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const deleteDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });

    const amountToSubtract = Number(deposit.amount);

    await deposit.deleteOne();

    const balance = await Balance.findOne();
    if (balance) {
      balance.capitalAmount -= amountToSubtract;
      balance.currentAmount -= amountToSubtract;
      await balance.save();
    }

    res.json({ message: "Deposit deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllDeposits,
  getDeposit,
  createDeposit,
  updateDeposit,
  deleteDeposit,
};