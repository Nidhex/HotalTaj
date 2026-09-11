const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A booking must belong to an authenticated user'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'A booking must be made for a specific room'],
    },
    checkIn: {
      type: Date,
      required: [true, 'Please provide a check-in date'],
    },
    checkOut: {
      type: Date,
      required: [true, 'Please provide a check-out date'],
    },
    guests: {
      adults: {
        type: Number,
        required: [true, 'Please specify the number of adult guests'],
        min: [1, 'At least 1 adult guest is required'],
      },
      children: {
        type: Number,
        default: 0,
        min: [0, 'Children count cannot be negative'],
      },
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
    },
    specialRequests: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Compound index to help search bookings quickly
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ user: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
