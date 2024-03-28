const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Define Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell your name.'],
    trim: true,
    minlength: [3, 'Your name must be more than 3 characters.'],
    maxlength: [50, 'Your name must be less than 50 characters.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide us your email.'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email.'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    minlength: [8, 'Password must be more than 8 characters.'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password.'],
    validate: {
      // Only works on save
      validator: function (el) {
        return el === this.password;
      },
      message: "Password doesn't match.",
    },
  },
  passwordChangedAt: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Hashing password then saving into database
// this points to the current document
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // only run if password is modified

  this.password = await bcrypt.hash(this.password, 12); // salt = 12

  this.passwordConfirm = undefined; // passwordConfirm field will not be stored in database.

  next();
});

// Updating passwordChangedAt field for when user has changed the password
// isModified & isNew is a built in function / property for mongoose
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// Find the user who is inactive or deleted
// Don't show in the output or in getAllUsers route
userSchema.pre(/^find/, function (next) {
  // this points to current query
  this.find({ active: { $ne: false } });
  next();
});

// Instance method for comparing passwords used for user authentication
userSchema.methods.comparePassword = async function (
  currentPassword,
  userPassword
) {
  return await bcrypt.compare(currentPassword, userPassword);
};

// Instance method for user who changed password after token was issued
userSchema.methods.changedPassword = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  return false; // False means not changed
};

// This method only create token for which the user can reset the password with given time
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Create Model
const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
