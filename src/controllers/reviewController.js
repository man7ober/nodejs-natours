const reviewModel = require('../models/reviewModel');
const ReviewModel = require('../models/reviewModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

// Get All Reviews
exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.params.tourId) {
    filter = {
      tour: req.params.tourId,
    };
  }

  const features = new APIFeatures(reviewModel.find(filter), req.query)
    .filter()
    .sort()
    .limit()
    .paginate();

  const reviews = await features.query;

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

// Get Review
exports.getReview = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const review = await ReviewModel.findById(id);

  res.status(200).json({
    status: 'success',
    data: { review },
  });
});

// Create Review
exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }

  // ⇡ Allow nested routes ⇣

  if (!req.body.user) {
    req.body.user = req.user.id;
  }

  const newReview = await ReviewModel.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { newReview },
  });
});

// Delete Review
exports.deleteReview = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const review = await ReviewModel.findByIdAndDelete(id);

  if (!review) {
    return next(new AppError('No review found with that id!', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Update Review
exports.updateReview = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const body = req.body;

  const review = await reviewModel.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!review) {
    return next(new AppError('No review found with that id!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { review },
  });
});
