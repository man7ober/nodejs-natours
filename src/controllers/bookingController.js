const stripe = require('stripe')(process.env.STRIPE_SECRET);

const BookingModel = require('../models/bookingModel');
const TourModel = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

exports.getCheckoutSession = async (req, res, next) => {
  // 1. Get the currently booked tour
  const tour = await TourModel.findById(req.params.tourId);

  // 2. Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }/&user=${req.user.id}/&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        price_data: {
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `https://man7ober-natours.onrender.com/img/tours/${tour.imageCover}`,
            ],
          },
          unit_amount: tour.price * 8300,
          currency: 'inr',
        },
        quantity: 1,
      },
    ],
  });

  // 3. Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
};

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  let { tour, user, price } = req.query;

  if (!tour || !user || !price) {
    return next();
  }

  tour = tour.replace('/', '');
  user = user.replace('/', '');

  await BookingModel.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = catchAsync(async (req, res, next) => {
  next();
});

exports.getAllBookings = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.params.tourId) {
    filter = {
      tour: req.params.tourId,
    };
  }

  const features = new APIFeatures(BookingModel.find(filter), req.query)
    .filter()
    .sort()
    .limit()
    .paginate();

  const bookings = await features.query;

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: { bookings },
  });
});

exports.getBooking = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const booking = await BookingModel.findById(id);

  res.status(200).json({
    status: 'success',
    data: { booking },
  });
});

exports.deleteBooking = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const booking = await BookingModel.findByIdAndDelete(id);

  if (!booking) {
    return next(new AppError('No booking found with that id!', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateBooking = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const body = req.body;

  const booking = await BookingModel.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!booking) {
    return next(new AppError('No booking found with that id!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { booking },
  });
});
