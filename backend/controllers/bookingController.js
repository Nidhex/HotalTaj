const Booking = require('../models/Booking');
const Room = require('../models/Room');

/**
 * @desc    Create a new booking (requires authentication)
 * @route   POST /api/bookings
 * @access  Private
 */
const createBooking = async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut, guests, specialRequests } = req.body;

    // 1. Basic validation
    if (!roomId || !checkIn || !checkOut || !guests || !guests.adults) {
      res.status(400);
      return next(new Error('Please provide roomId, checkIn, checkOut dates, and guests details'));
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      res.status(400);
      return next(new Error('Invalid check-in or check-out date format'));
    }

    if (checkInDate >= checkOutDate) {
      res.status(400);
      return next(new Error('Check-in date must be strictly before check-out date'));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      res.status(400);
      return next(new Error('Check-in date cannot be in the past'));
    }

    // 2. Fetch the room
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404);
      return next(new Error(`Room not found with ID ${roomId}`));
    }

    if (!room.isAvailable) {
      res.status(400);
      return next(new Error('This room is currently out of order or unavailable for booking'));
    }

    // 3. Validate guest count against room capacity
    const totalGuestsCount = Number(guests.adults) + Number(guests.children || 0);
    if (totalGuestsCount > room.maxGuests) {
      res.status(400);
      return next(
        new Error(
          `This room accommodates a maximum of ${room.maxGuests} guests. Your request is for ${totalGuestsCount} guests.`
        )
      );
    }

    // 4. Double-booking conflict prevention (Check overlap)
    const overlappingBooking = await Booking.findOne({
      room: roomId,
      status: { $ne: 'cancelled' },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    if (overlappingBooking) {
      res.status(409); // Conflict status code
      return next(
        new Error(
          `This room is already reserved for the selected dates. Please choose different dates or another accommodation.`
        )
      );
    }

    // 5. Calculate stay duration and total price
    const differenceInTime = checkOutDate.getTime() - checkInDate.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24)); // Minimum 1 night
    const stayNights = differenceInDays > 0 ? differenceInDays : 1;

    const totalPrice = stayNights * room.pricePerNight;

    // 6. Create booking entry in database
    const booking = await Booking.create({
      user: req.user._id,
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: {
        adults: Number(guests.adults),
        children: Number(guests.children || 0),
      },
      totalPrice,
      status: 'confirmed', // Defaults to confirmed as payments are not integrated yet
      specialRequests,
    });

    // Populate user details (name, email) and room details for the response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('room', 'roomNumber name type pricePerNight');

    res.status(201).json({
      success: true,
      message: 'Booking created and confirmed successfully',
      data: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get booking history for the logged-in user
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('room', 'roomNumber name type pricePerNight images')
      .sort('-createdAt'); // Latest bookings first

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get details of a specific booking
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('room', 'roomNumber name type pricePerNight images');

    if (!booking) {
      res.status(404);
      return next(new Error(`Booking not found with ID ${req.params.id}`));
    }

    // Authorization check: User must be either the booker, or an admin/concierge
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      !['admin', 'concierge'].includes(req.user.role)
    ) {
      res.status(403);
      return next(new Error('You are not authorized to view this booking details'));
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a booking (authenticated user can cancel their own, admin/concierge can cancel any)
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      return next(new Error(`Booking not found with ID ${req.params.id}`));
    }

    // Authorization check: User must be either the booker, or an admin/concierge
    if (
      booking.user.toString() !== req.user._id.toString() &&
      !['admin', 'concierge'].includes(req.user.role)
    ) {
      res.status(403);
      return next(new Error('You are not authorized to cancel this booking'));
    }

    // Check current status
    if (booking.status === 'cancelled') {
      res.status(400);
      return next(new Error('This booking is already cancelled'));
    }

    if (booking.status === 'completed') {
      res.status(400);
      return next(new Error('Completed bookings cannot be cancelled'));
    }

    // Restrict cancellation if check-in has already passed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (booking.checkIn < today && !['admin', 'concierge'].includes(req.user.role)) {
      res.status(400);
      return next(new Error('Bookings with past check-in dates cannot be self-cancelled. Please contact concierge.'));
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookings (Admin/Concierge only)
 * @route   GET /api/bookings
 * @access  Private/Admin
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { status, room, user } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (room) filter.room = room;
    if (user) filter.user = user;

    const bookings = await Booking.find(filter)
      .populate('user', 'name email')
      .populate('room', 'roomNumber name type pricePerNight')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update booking status (Admin/Concierge only)
 * @route   PUT /api/bookings/:id/status
 * @access  Private/Admin
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      res.status(400);
      return next(new Error('Please provide a valid status: pending, confirmed, cancelled, completed'));
    }

    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      return next(new Error(`Booking not found with ID ${req.params.id}`));
    }

    booking.status = status;
    await booking.save();

    // Re-query to get populated details for response
    booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('room', 'roomNumber name type pricePerNight');

    res.status(200).json({
      success: true,
      message: `Booking status updated to '${status}' successfully`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
};
