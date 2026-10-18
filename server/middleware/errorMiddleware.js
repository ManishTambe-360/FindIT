exports.notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

exports.errorHandler = (err, req, res, next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  // Duplicate key (e.g. email)
  if (err.code === 11000) {
    status = 400;
    message = 'Duplicate value: that record already exists';
  }

  res.status(status).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};