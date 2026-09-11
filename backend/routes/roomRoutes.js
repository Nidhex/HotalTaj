const express = require('express');
const router = express.Router();

const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  checkAvailability,
} = require('../controllers/roomController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Public room discovery endpoints
router.get('/', getAllRooms);
router.get('/check-availability', checkAvailability);
router.get('/:id', getRoomById);

// Protected room management endpoints (Admin & Concierge only)
router.post('/', protect, authorize('admin', 'concierge'), createRoom);
router.put('/:id', protect, authorize('admin', 'concierge'), updateRoom);
router.delete('/:id', protect, authorize('admin', 'concierge'), deleteRoom);

module.exports = router;
