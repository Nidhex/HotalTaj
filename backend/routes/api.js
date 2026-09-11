const express = require('express');
const router = express.Router();

// Import controllers
const { getApiStatus } = require('../controllers/testController');

// Define API routes
router.get('/test', getApiStatus);

module.exports = router;
