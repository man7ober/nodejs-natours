/**** 
  ROUTES <=> CONTROLLER <=> MODEL
*****/

// Import Libraries
const path = require('path');
const morgan = require('morgan');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

// Import Routes
const tourRouter = require('./src/routes/tourRoutes');
const userRouter = require('./src/routes/userRoutes');
const reviewRouter = require('./src/routes/reviewRoutes');
const bookingRouter = require('./src/routes/bookingRoutes');

// Import Controllers
const errorController = require('./src/controllers/errorController');

// Import Utils
const AppError = require('./src/utils/appError');
const viewRouter = require('./src/routes/viewRoutes');

const app = express();

// Setting up PUG Engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'src/views'));

// Enabling Proxy
app.enable('trust proxy');

// Enabling CORS - Access-Control-Allow-Origin *
app.use(cors());
app.options('*', cors()); // Preflight phase

// 1. Helmet - set security HTTP headers => Middleware
app.use(helmet());

// 2. Rate Limiter - stopping multiple request coming from same IP => Middleware
const limiter = rateLimit({
  max: 10,
  windowsMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter);

// 3. Serve Static Files => Middleware
app.use(express.static(path.join(__dirname, 'public')));

// 4. Body-Parser - reading data from body sent from HTTP POST request  => Middleware
// 4. Cookie-Parse - reading data from cookies
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 5. Data Sanitization Against => Middleware
app.use(mongoSanitize()); // NoSQL Query Injection = removing all mongodb symbols
app.use(xss()); // XSS Attack = changing html code to some other html entity

// 6. Prevent Parameter Pollution => Middleware
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
); // clears the query string

// 7. HTTP Request Console Logger => 3rd Party Middleware
process.env.NODE_ENV === 'development' && app.use(morgan('dev'));

app.use(compression());

// 8. Mounting Routes => Middleware
app.use('/', viewRouter); // => Moves to routes/viewRoutes
app.use('/api/v1/tours', tourRouter); // => Moves to routes/tourRoutes
app.use('/api/v1/users', userRouter); // => Moves to routes/userRoutes
app.use('/api/v1/reviews', reviewRouter); // => Moves to routes/reviewRoutes
app.use('/api/v1/bookings', bookingRouter); // => Moves to routes/BookingRoutes

// 9. Handling Unhandled (404) Routes => Middleware
app.all('*', (req, res, next) => {
  next(
    new AppError(`Route ${req.originalUrl} not found on this server ☹️!`, 404)
  ); // Passes through all the middlewares);
});

// 10. Global Error Handling - catch by catchAsync function => Middleware
app.use(errorController);

module.exports = app;
