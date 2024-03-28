const mongoose = require('mongoose');
const TourModel = require('./tourModel');

// Define Schema
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review cannot be empty.'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'A rating must be between 1 and 5.'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* Compound + Unique Indexing
  => One user cannot write multiple reviews for tour 
*/
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Populating Reviews => fetch only the particular fields from the db
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  this.populate({
    path: 'tour',
    select: 'name imageCover',
  });

  next();
});

// Calculating Average Ratings on Tour => installing aggregation pipeline
reviewSchema.statics.calAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await TourModel.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await TourModel.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calAverageRatings(this.tour);
});

// Calculating Average Ratings on Tour => updating & deleting review
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.rev = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.rev.constructor.calAverageRatings(this.rev.tour);
});

// Create Model
const reviewModel = mongoose.model('Review', reviewSchema);

module.exports = reviewModel;
