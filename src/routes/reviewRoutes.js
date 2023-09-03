const express = require('express');

const { checkIdentity, checkRole } = require('../controllers/authController');
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  getReview,
} = require('../controllers/reviewController');

// (reviewRoutes) child can merge params from parent (tourRoutes)
const reviewRouter = express.Router({ mergeParams: true });

// All below routes is protected with this middleware
reviewRouter.use(checkIdentity);

reviewRouter
  .route('/') //
  .get(getAllReviews)
  .post(checkRole('user'), createReview);

reviewRouter
  .route('/:id') //
  .get(getReview)
  .delete(checkRole('user'), deleteReview)
  .patch(checkRole('user'), updateReview);

module.exports = reviewRouter;
