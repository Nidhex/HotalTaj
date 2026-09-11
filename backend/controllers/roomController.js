const Room = require('../models/Room');
const Booking = require('../models/Booking');

/**
 * @desc    Get all rooms (supports filtering by type, price, maxGuests)
 * @route   GET /api/rooms
 * @access  Public
 */
const getAllRooms = async (req, res, next) => {
  try {
    const { type, maxPrice, guests } = req.query;
    const query = {};

    // Filter by room type (room, suite, villa)
    if (type && ['room', 'suite', 'villa'].includes(type.toLowerCase())) {
      query.type = type.toLowerCase();
    }

    // Filter by max price per night
    if (maxPrice) {
      query.pricePerNight = { $lte: Number(maxPrice) };
    }

    // Filter by guest capacity
    if (guests) {
      query.maxGuests = { $gte: Number(guests) };
    }

    const rooms = await Room.find(query);

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single room by ID
 * @route   GET /api/rooms/:id
 * @access  Public
 */
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      return next(new Error(`Room not found with ID ${req.params.id}`));
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new room (Admin only)
 * @route   POST /api/rooms
 * @access  Private/Admin
 */
const createRoom = async (req, res, next) => {
  try {
    const { roomNumber, name, type, pricePerNight, maxGuests, description, amenities, images } = req.body;

    // Check if room number already exists
    const roomExists = await Room.findOne({ roomNumber });
    if (roomExists) {
      res.status(400);
      return next(new Error(`Room with room number ${roomNumber} already exists`));
    }

    const room = await Room.create({
      roomNumber,
      name,
      type,
      pricePerNight,
      maxGuests,
      description,
      amenities,
      images,
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a room's details (Admin only)
 * @route   PUT /api/rooms/:id
 * @access  Private/Admin
 */
const updateRoom = async (req, res, next) => {
  try {
    let room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      return next(new Error(`Room not found with ID ${req.params.id}`));
    }

    // If room number is being changed, verify it's unique
    if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
      const roomExists = await Room.findOne({ roomNumber: req.body.roomNumber });
      if (roomExists) {
        res.status(400);
        return next(new Error(`Room with room number ${req.body.roomNumber} already exists`));
      }
    }

    room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a room (Admin only)
 * @route   DELETE /api/rooms/:id
 * @access  Private/Admin
 */
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      return next(new Error(`Room not found with ID ${req.params.id}`));
    }

    // Check if room has active upcoming bookings before deletion
    const activeBookingsCount = await Booking.countDocuments({
      room: req.params.id,
      status: { $in: ['confirmed', 'pending'] },
      checkOut: { $gte: new Date() },
    });

    if (activeBookingsCount > 0) {
      res.status(400);
      return next(new Error(`Cannot delete room. It has ${activeBookingsCount} active upcoming booking(s).`));
    }

    await Room.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check room availability for specific dates
 * @route   GET /api/rooms/check-availability
 * @access  Public
 */
const checkAvailability = async (req, res, next) => {
  try {
    const { checkIn, checkOut, type, guests } = req.query;

    if (!checkIn || !checkOut) {
      res.status(400);
      return next(new Error('Please provide both checkIn and checkOut dates'));
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      res.status(400);
      return next(new Error('Invalid date formats provided'));
    }

    if (checkInDate >= checkOutDate) {
      res.status(400);
      return next(new Error('Check-in date must be before check-out date'));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      res.status(400);
      return next(new Error('Check-in date cannot be in the past'));
    }

    // 1. Find all bookings that overlap with the selected dates and are active (not cancelled)
    const bookedRooms = await Booking.find({
      status: { $ne: 'cancelled' },
      $or: [
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gt: checkInDate },
        },
      ],
    }).select('room');

    const bookedRoomIds = bookedRooms.map(booking => booking.room);

    // 2. Build search query for available rooms
    const query = {
      _id: { $nin: bookedRoomIds },
      isAvailable: true,
    };

    if (type && ['room', 'suite', 'villa'].includes(type.toLowerCase())) {
      query.type = type.toLowerCase();
    }

    if (guests) {
      query.maxGuests = { $gte: Number(guests) };
    }

    const availableRooms = await Room.find(query);

    res.status(200).json({
      success: true,
      count: availableRooms.length,
      data: availableRooms,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  checkAvailability,
};
