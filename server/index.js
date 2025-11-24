const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan('dev')); // Use 'combined' for production logs
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/deposits', require('./routes/deposits'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/balance', require('./routes/balance'));

// Start server only after DB connection
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
  }
};

startServer();