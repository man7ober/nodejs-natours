const stripe = require('stripe')(process.env.STRIPE_SECRET);

const BookingModel = require('../models/bookingModel');
const TourModel = require('../models/tourModel');
const UserModel = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await UserModel.findOne({ email: session.customer_email })).id;
  const price = line_items[0].unit_amount;

  await BookingModel.create({ tour, user, price });
};

exports.getCheckoutSession = async (req, res, next) => {
  // 1. Get the currently booked tour
  const tour = await TourModel.findById(req.params.tourId);

  // 2. Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        price_data: {
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 10000,
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

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({
    received: true,
  });
};

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
