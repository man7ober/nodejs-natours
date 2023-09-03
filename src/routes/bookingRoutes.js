const express = require('express');

const {
  getCheckoutSession,
  getAllBookings,
  createBooking,
  deleteBooking,
  updateBooking,
  getBooking,
} = require('./../controllers/bookingController');
const { checkIdentity, checkRole } = require('./../controllers/authController');

const bookingRouter = express.Router();

bookingRouter.use(checkIdentity);

bookingRouter.get(
  '/checkout-session/:tourId',
  checkIdentity,
  getCheckoutSession
);

bookingRouter.use(checkRole('admin', 'lead-guide'));

bookingRouter
  .route('/') //
  .get(getAllBookings)
  .post(createBooking);

bookingRouter
  .route('/:id') //
  .get(getBooking)
  .patch(updateBooking)
  .delete(deleteBooking);

module.exports = bookingRouter;
