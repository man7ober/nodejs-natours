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
  adminTours,
  adminBillings,
  adminReviews,
  adminUsers,
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
viewRouter.get('/admin-tours', checkIdentity, adminTours);
viewRouter.get('/admin-reviews', checkIdentity, adminReviews);
viewRouter.get('/admin-users', checkIdentity, adminUsers);
viewRouter.get('/admin-billings', checkIdentity, adminBillings);

viewRouter.post('/submit-user-data', checkIdentity, updateUser);

module.exports = viewRouter;
