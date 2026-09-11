const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please add a room number'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a room name'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Please select room type'],
      enum: ['room', 'suite', 'villa'],
      lowercase: true,
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Please add a price per night'],
      min: [0, 'Price cannot be negative'],
    },
    maxGuests: {
      type: Number,
      required: [true, 'Please specify maximum guest capacity'],
      default: 2,
      min: [1, 'Capacity must be at least 1 guest'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

module.exports = mongoose.model('Room', roomSchema);
