const express = require('express');

const { checkIdentity, checkRole } = require('../controllers/authController');

const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  topExpensive,
  topCheap,
  getTourStats,
  getMonthlyPlan,
  getToursWithinRadius,
  getDistances,
  resizeTourImages,
  uploadTourImages,
} = require('../controllers/tourController');

const reviewRouter = require('./reviewRoutes');

const tourRouter = express.Router();

// Mounting => Moves to routes/reviewRoutes
tourRouter.use('/:tourId/reviews', reviewRouter);

// Tour Routes => Moves to controllers/tourController
tourRouter
  .route('/') //
  .get(getAllTours)
  .post(checkIdentity, checkRole('admin', 'lead-guide'), createTour);

tourRouter
  .route('/:id') //
  .get(getTour)
  .patch(
    checkIdentity,
    checkRole('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(checkIdentity, checkRole('admin', 'lead-guide'), deleteTour);

tourRouter
  .route('/top-5-expensive') //
  .get(topExpensive, getAllTours); // Middleware Chaining

tourRouter
  .route('/tour-stats') //
  .get(getTourStats);

tourRouter
  .route('/monthly-plan/:year') //
  .get(
    checkIdentity,
    checkRole('guide', 'lead-guide', 'admin'),
    getMonthlyPlan
  );

tourRouter
  .route('/top-5-cheap') //
  .get(topCheap, getAllTours); // Middleware Chaining

tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit') //
  .get(getToursWithinRadius);

tourRouter
  .route('/distance/:latlng/unit/:unit') //
  .get(getDistances);

module.exports = tourRouter;
