const Deposit = require('../models/Deposit');
const Balance = require('../models/Balance');

// GET all deposits
const getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ date: -1 });

    // calculate total amount
    const totalAmount = deposits.reduce((sum, item) => {
      return sum + Number(item.amount);
    }, 0);

    res.json({
      totalAmount,
      deposits
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// GET single deposit
const getDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    res.json(deposit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST new deposit (ADD TO BALANCE)
const createDeposit = async (req, res) => {
  try {
    const { name, amount, date } = req.body;

    const amountNumber = Number(amount);
    if (isNaN(amountNumber)) {
      return res.status(400).json({ message: "Amount must be a number" });
    }

    // 1️⃣ Save deposit entry
    const newDeposit = await Deposit.create({
      name,
      amount: amountNumber,
      date,
    });

    // 2️⃣ Ensure balance exists (if not, create one)
    let balance = await Balance.findOne();

    if (!balance) {
      balance = new Balance({
        capitalAmount: amountNumber,
        currentAmount: amountNumber,
      });
    } else {
      balance.capitalAmount = Number(balance.capitalAmount) + amountNumber;
      balance.currentAmount = Number(balance.currentAmount) + amountNumber;
    }

    await balance.save();

    res.status(201).json(newDeposit);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE deposit (old + new)
const updateDeposit = async (req, res) => {
  const { id } = req.params;
  const { name, amount, date } = req.body;

  try {
    const deposit = await Deposit.findById(id);
    if (!deposit) {
      return res.status(404).json({ message: "Deposit not found" });
    }

    const newAmount = Number(amount);
    const oldAmount = Number(deposit.amount);

    // ADD NEW AMOUNT on top of old amount
    const updatedAmount = oldAmount + newAmount;

    // update deposit
    deposit.name = name;
    deposit.amount = updatedAmount;
    deposit.date = date || deposit.date;
    await deposit.save();

    // update balance
    const balance = await Balance.findOne();
    if (balance) {
      balance.capitalAmount = Number(balance.capitalAmount) + newAmount;
      balance.currentAmount = Number(balance.currentAmount) + newAmount;
      await balance.save();
    }

    res.json(deposit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE deposit
const deleteDeposit = async (req, res) => {
  const { id } = req.params;

  try {
    const deposit = await Deposit.findById(id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });

    const oldAmount = Number(deposit.amount);

    await deposit.deleteOne();

    // update balance
    const balance = await Balance.findOne();
    if (balance) {
      balance.capitalAmount = Number(balance.capitalAmount) - oldAmount;
      balance.currentAmount = Number(balance.currentAmount) - oldAmount;
      await balance.save();
    }

    res.json({ message: "Deposit deleted" });
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
