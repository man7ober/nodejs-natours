const express = require('express');

const { isLoggedIn, checkIdentity } = require('../controllers/authController');

const {
  getOverview,
  getTour,
  getMyTours,
  getLogin,
  getSignup,
  getAccount,
  updateUser,
  getBilling,
  getReviews,
} = require('../controllers/viewsController');

const { createBookingCheckout } = require('../controllers/bookingController');

const viewRouter = express.Router();

viewRouter.get('/', createBookingCheckout, isLoggedIn, getOverview);
viewRouter.get('/tour/:slug', isLoggedIn, getTour);
viewRouter.get('/login', isLoggedIn, getLogin);
viewRouter.get('/signup', isLoggedIn, getSignup);
viewRouter.get('/account', checkIdentity, getAccount);
viewRouter.get('/my-tours', checkIdentity, getMyTours);
viewRouter.get('/my-billings', checkIdentity, getBilling);
viewRouter.get('/my-reviews', checkIdentity, getReviews);

viewRouter.post('/submit-user-data', checkIdentity, updateUser);

module.exports = viewRouter;
