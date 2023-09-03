const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // if error it will catch by global error handling middleware.
  };
};

module.exports = catchAsync;
