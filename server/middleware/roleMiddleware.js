// Usage: authorize('admin')
exports.authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('You do not have permission to do this'));
    }
    next();
  };