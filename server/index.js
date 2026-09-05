// Load env vars FIRST before requiring routes that rely on them
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');
const authRoutes = require('./src/routes/auth.routes');
const aiRoutes = require('./src/routes/ai.routes');
const bookRoutes = require('./src/routes/book.routes');
const imageRoutes = require('./src/routes/image.routes');
const analysisRoutes = require('./src/routes/analysis.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

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

const path = require('path');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/images', imageRoutes);
app.use('/api', analysisRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Base route for health check
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to BookGenie AI API' });
});

// Centralized error handler should be the last middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
