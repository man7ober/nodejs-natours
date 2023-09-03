const express = require('express');

// Import User Controller
const {
  getAllUsers,
  updateUser,
  updateAdmin,
  deleteUser,
  deleteAdmin,
  getUser,
  getLoggedInUser,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/userController');

const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  checkIdentity,
  checkRole,
} = require('../controllers/authController');

const userRouter = express.Router();

// Auth Routes => Moves to controllers/authController
userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.get('/logout', logout);
userRouter.post('/forgotPassword', forgotPassword);
userRouter.patch('/resetPassword/:token', resetPassword);

// Protect all routes after this middleware
userRouter.use(checkIdentity);

userRouter.patch('/updateMyPassword', updatePassword);
userRouter.patch('/updateUser', uploadUserPhoto, resizeUserPhoto, updateUser);
userRouter.patch('/deleteUser', deleteUser);

// All below routes is protected with this middleware
userRouter.use(checkRole('admin'));

// User Routes => Moves to controllers/userController
userRouter
  .route('/') //
  .get(getAllUsers);

userRouter
  .route('/currentLoggedInUser') //
  .get(getLoggedInUser);

userRouter
  .route('/:id') //
  .get(getUser)
  .patch(updateAdmin)
  .delete(deleteAdmin);

module.exports = userRouter;
