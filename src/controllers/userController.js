const multer = require('multer');
const sharp = require('sharp');

const UserModel = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

/*****************************/

// This function is used in UpdateMe
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

// Update User
exports.updateUser = catchAsync(async (req, res, next) => {
  // 1. Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword!',
        400
      )
    );
  }

  // 2. Filtered out unwanted fields except name & email
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // 2. Update user document
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

// Delete User
exports.deleteUser = catchAsync(async (req, res, next) => {
  await UserModel.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
  });
});

// Get All Users
exports.getAllUsers = catchAsync(async (req, res) => {
  const features = new APIFeatures(UserModel.find(), req.query)
    .filter()
    .sort()
    .limit()
    .paginate();

  const users = await features.query;

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
  });
});

// Get User by ID
exports.getUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const user = await UserModel.findById(id);

  if (!user) {
    return next(new AppError('No user found with that id!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// Get Current Logged In User
exports.getLoggedInUser = catchAsync(async (req, res, next) => {
  const id = req.user.id;

  const user = await UserModel.findById(id);

  if (!user) {
    return next(new AppError('No user found with that id!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// Update by Admin
exports.updateAdmin = catchAsync(async (req, res, next) => {
  const doc = await UserModel.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// // Delete by Admin
exports.deleteAdmin = catchAsync(async (req, res, next) => {
  const doc = await UserModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});
