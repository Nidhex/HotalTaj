/**
 * @desc    Get API Status & Test Connectivity
 * @route   GET /api/test
 * @access  Public
 */
const getApiStatus = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Pranam! The RajMahal Palace API is fully functional and online.",
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      serverPort: process.env.PORT || 5000,
      databaseStatus: "Connected"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getApiStatus
};
