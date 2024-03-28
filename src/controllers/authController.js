const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const catchAsync = require('../utils/catchAsync');
const UserModel = require('./../models/userModel');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const { log } = require('console');

// Creating JSON WEB TOKEN
const signToken = (id) => {
  return jwt.sign(
    { id: id }, // Payload
    process.env.JWT_SECRET, // Secret
    { expiresIn: process.env.JWT_EXPIRES_IN } // Expiration Time
  );
};

// Sending JSON WEB TOKEN
const sendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from showing in output
  user.password = undefined;
  user.passwordChangedAt = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await UserModel.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/account`;

  await new Email(newUser, url).sendWelcome();

  // Using JSON WEB TOKEN
  sendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email & password exists
  if (!email || !password) {
    return next(new AppError('Please provide email & password!', 400));
  }

  // 2. Check if user exists & password is correct
  const user = await UserModel.findOne({ email }).select('+password');

  let comparePass;

  if (user) {
    // comparePassword is a method defined in UserModel
    comparePass = await user.comparePassword(password, user.password);
  }

  if (!user || !comparePass) {
    return next(new AppError('Incorrect email or password 👎', 401));
  }

  // 3. If everything ok, send token to client
  sendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
};

// Check if the user is logged in & have valid token [protect]
exports.checkIdentity = catchAsync(async (req, res, next) => {
  // 1. Getting & Checking token
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2. Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check if user still exists
  const currentUser = await UserModel.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(`User belonging to this token doesn't exists`),
      401
    );
  }

  // 4. Check if user changed password after the token was issued
  if (await currentUser.changedPassword(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // Grant access to the user
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Check if the user is lead-guide or admin [restrictTo]
// To perform action on particular route
exports.checkRole = (...roles) => {
  return (req, res, next) => {
    // req.user.role came from previous middleware which is checkIdentity
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action!', 403)
      );
    }

    next();
  };
};

// Step 1 - check mailtrap account for the token
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on email
  const user = await UserModel.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  // 2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // 3. Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token has been sent to user!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email. Try again later!', 500)
    );
  }
});

// Step 2 - copy the token & paste it at the end of this api
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If the token is not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired!', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save(); // save to the database

  // 3. Update changedPasswordAt property for the user in userModel at userSchema.pre()

  // 4. Log the user in, send JWT
  sendToken(user, 200, req, res);
});

// Check if currentPassword is same as password stored in DB
// Then update the password and again store in DB
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await UserModel.findById(req.user.id).select('+password');

  // 2. Check if Posted current password is correct
  let comparePass;

  if (user) {
    // comparePassword is a method defined in UserModel
    comparePass = await user.comparePassword(
      req.body.passwordCurrent,
      user.password
    );
  }

  if (!user || !comparePass) {
    return next(new AppError('Your current password is wrong!', 401));
  }

  // 3. If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4. Log user in, send JWT
  sendToken(user, 200, req, res);
});

// Only for rendered pages
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1. Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2. Check if user still exists
      const currentUser = await UserModel.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // 3. Check if user changed password after the token was issued
      if (await currentUser.changedPassword(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};
