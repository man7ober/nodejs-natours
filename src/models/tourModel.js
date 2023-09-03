const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// Define Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: [true, 'A tour must have a name.'],
      minlength: [10, 'A tour name must be more than 10 characters.'],
      maxlength: [40, 'A tour name must be less than 40 characters.'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty.'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A difficulty must be either: easy, medium or difficult.',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A rating must be above 1.0.'],
      max: [5, 'A rating must be below 5.'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price.'],
    },
    discount: {
      type: Number,
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: 'A discount must be less than regular price.',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary.'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image.'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    slug: { type: String },
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON - Embedded Documents [DE-NORMALIZED]
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        // GeoJSON - Embedded Documents [DE-NORMALIZED]
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/*
  Compound + Unique Indexing
*/
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

/* Virtual Property 
  => No Persistence 
*/
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

/* Virtual Populate */
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

/* 1. Document Middleware (Hooks) 
  => this refers to the document 
  => pre - Before document is saved '.save()' & '.create()'
  => post - After document is saved '.save()' & '.create()'
*/
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  console.log('Data before saving...');
  next();
});

tourSchema.post('save', function (docs, next) {
  console.log('Data after saving...');
  next();
});

/* 2. Query Middleware (Hooks) 
  => this refers to the query
*/
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = new Date();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  this.end = new Date();
  console.log(`Query took ${this.end - this.start} ms`);
  next();
});

/* 3. Aggregation Middleware (Hooks)
  => this refers to the current aggregation object
  => this.pipeline refers to multiple filter chaining in getTourStats & getMonthlyPlan Controller 
*/
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

// Create Model
const TourModel = mongoose.model('Tour', tourSchema);

module.exports = TourModel;
