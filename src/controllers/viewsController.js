const BookingModel = require('../models/bookingModel');
const TourModel = require('../models/tourModel');
const UserModel = require('../models/userModel');
const ReviewModel = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await TourModel.find();

  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.adminTours = catchAsync(async (req, res) => {
  const tours = await TourModel.find();

  res.status(200).render('adminTours', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await TourModel.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1. Find all bookings
  const bookings = await BookingModel.find({ user: req.user.id });

  // 2. Find tour with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await TourModel.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.getLogin = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getSignup = (req, res) => {
  res.status(200).render('signup', {
    title: 'Sign into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Account Management',
  });
};

exports.adminUsers = catchAsync(async (req, res) => {
  const users = await UserModel.find();

  res.status(200).render('adminUsers', {
    title: 'All Users',
    users,
  });
});

exports.adminBillings = catchAsync(async (req, res) => {
  const billings = await BookingModel.find();

  res.status(200).render('adminBillings', {
    title: 'All Billing',
    billings,
  });
});

exports.getBilling = catchAsync(async (req, res) => {
  const billings = await BookingModel.find({ user: req.user.id });

  res.status(200).render('billing', {
    title: 'Billing',
    billings,
  });
});

exports.adminReviews = catchAsync(async (req, res) => {
  const adminReviews = await ReviewModel.find();

  res.status(200).render('adminReviews', {
    title: 'All Reviews',
    adminReviews,
  });
});

exports.getReviews = catchAsync(async (req, res) => {
  const userReviews = await ReviewModel.find({ user: req.user.id });

  res.status(200).render('review', {
    title: 'Reviews',
    userReviews,
  });
});

exports.updateUser = catchAsync(async (req, res) => {
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Account Management',
    user: updatedUser,
  });
});
