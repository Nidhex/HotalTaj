const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Prevents returning password string in queries by default
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'concierge'],
      default: 'customer',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpire: Date,
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

// Encrypt password using bcryptjs before saving user to database
userSchema.pre('save', async function (next) {
  // Only run if password field is being modified/created
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with database hashed password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash secure verification token
userSchema.methods.getVerificationToken = function () {
  const crypto = require('crypto');
  
  // Create raw verification token
  const token = crypto.randomBytes(20).toString('hex');

  // Hash token and set to verificationToken field
  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Set token expiration to 24 hours from now
  this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;

  return token; // Return raw token to send via email
};

module.exports = mongoose.model('User', userSchema);
