const multer = require('multer');
const sharp = require('sharp');

const TourModel = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures'); // Reusable Component
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/* Uploading & Storing image */
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload image of type[jpg, png]!', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1. Cover Image
  req.body.imageCover = `tours-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.file.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2. Other Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tours-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );
  next();
});
/****************************/

/*
  Errors are CATCH by catchAsync function & 
  HANDLE by global error handler middleware (index.js)
*/

// Get Expensive Tours
exports.topExpensive = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-price,ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// Get Cheap Tours
exports.topCheap = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// Get All Tours
exports.getAllTours = catchAsync(async (req, res, next) => {
  // Fetching methods from APIFeatures
  const features = new APIFeatures(TourModel.find(), req.query)
    .filter()
    .sort()
    .limit()
    .paginate();

  // Execute Query
  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

// Get Tour
exports.getTour = catchAsync(async (req, res, next) => {
  const id = req.params.id; // Get Paramter from URL

  const tour = await TourModel.findById(id).populate('reviews'); // Fetch single tour from db

  // If tour not found with the given id
  if (!tour) {
    return next(new AppError('No tour found with that id!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});

// Create Tour
exports.createTour = catchAsync(async (req, res, next) => {
  const newtour = await TourModel.create(req.body); // Create tour & store into db

  res.status(201).json({
    status: 'success',
    data: { newtour },
  });
});

// Update Tour
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError('No tour found with that id!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});

// Delete Tour
exports.deleteTour = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const tour = await Model.findByIdAndDelete(id);

  if (!tour) {
    return next(new AppError('No tour found with that id!', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Get Tour Stats
exports.getTourStats = catchAsync(async (req, res, next) => {
  // Aggregation Pipeline (Mongodb)
  const stats = await TourModel.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

// Get Monthly Plan
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // Convert String into Number

  const plan = await TourModel.aggregate([
    {
      $unwind: '$startDates', // One document for every [startdates]
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});

// Get Tours within Radius
exports.getToursWithinRadius = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude & longitude in the given format i.e lat,lng.',
        400
      )
    );
  }

  // Geospatial Query Operator [MongoDB]
  const tour = await TourModel.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tour.length,
    data: { tour },
  });
});

// Get Distances of Tours
exports.getDistances = catchAsync(async (req, res) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude & longitude in the given format i.e lat,lng.',
        400
      )
    );
  }

  const tourDistance = await TourModel.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { tourDistance },
  });
});
