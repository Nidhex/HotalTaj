const express = require('express');
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All booking routes require user authentication
router.use(protect);

// Customer booking creation & history
router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);

// Specific booking details & self-cancellation
router.get('/:id', getBookingById);
router.put('/:id/cancel', cancelBooking);

// Admin / Concierge booking administration
router.get('/', authorize('admin', 'concierge'), getAllBookings);
router.put('/:id/status', authorize('admin', 'concierge'), updateBookingStatus);

module.exports = router;
