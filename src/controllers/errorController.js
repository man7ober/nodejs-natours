const AppError = require('../utils/appError');

const handleDuplicateFieldsDB = (err) => {
  const value = err.message.split('"')[1];
  const message = `Duplicate field value: "${value}". Please use another value!`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again!', 401);
};

const handleTokenExpiredError = () => {
  return new AppError('Your token is expired! Please log in again.', 401);
};

const sendErrorDev = (err, req, res) => {
  // a) API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      err: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // b) Rendered Website
    console.error('Error 💥');

    return res.status(err.statusCode).render('error', {
      title: 'Uh oh! Something went wrong! ',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // a) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // Programming, Other Unknown Error => dont wont to leak error details
      // 1. Log Error
      console.error('Error 💥');

      // 2. Send Generic Message
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      });
    }

    // b) Rendered Website
  } else {
    if (err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'Uh oh! Something went wrong! ',
        msg: err.message,
      });
    } else {
      // Programming, Other Unknown Error => dont wont to leak error details
      // 1. Log Error
      console.error('Error 💥');

      // 2. Send Generic Message
      return res.status(err.statusCode).render('error', {
        title: 'Uh oh! Something went wrong! ',
        msg: 'Please try again later.',
      });
    }
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  }

  if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();

    sendErrorProd(error, req, res);
  }
};
