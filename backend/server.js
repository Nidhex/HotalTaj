const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from config file
dotenv.config();

// Connect to MongoDB database
connectDB();

// Initialize Express application
const app = express();

/* --- 1. Global Middlewares --- */

// Enable Cross-Origin Resource Sharing (CORS) - critical for static frontends
app.use(cors());

// Body parser to read JSON payloads in req.body
app.use(express.json());

// URL-encoded form data parser
app.use(express.urlencoded({ extended: false }));

// HTTP Request logging during development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* --- 2. API Routes --- */

// Direct test endpoint at API root
app.get('/', (req, res) => {
  res.status(200).send('<h1>RajMahal Luxury Palace Server is Live</h1><p>Navigate to <code>/api/test</code> for the JSON status report.</p>');
});

// Import and use modular API routers
app.use('/api', require('./routes/api'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

/* --- 3. Error Handling Middleware (Scalable framework) --- */
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

/* --- 4. Server Initialization --- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] RajMahal Palace API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
