const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');
const authRoutes = require('./src/routes/auth.routes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Body parser
app.use(express.json());

// Cookie parser (for reading httpOnly refresh tokens)
app.use(cookieParser());

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Vite default port
    credentials: true, // Required to allow cookies to be sent across origins
  })
);

// Mount routers
app.use('/api/auth', authRoutes);

// Base route for health check
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to BookGenie AI API' });
});

// Centralized error handler should be the last middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
