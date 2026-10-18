const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  reputationPoints: user.reputationPoints,
});

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      throw new Error('Email already registered');
    }

    // role is never taken from the request body, so nobody can self-register as admin
    const user = await User.create({ name, email, password, phone });

    res.status(201).json({ user: userResponse(user), token: generateToken(user._id) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }
    if (user.isBlocked) {
      res.status(403);
      throw new Error('Your account has been blocked');
    }

    res.json({ user: userResponse(user), token: generateToken(user._id) });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: userResponse(req.user) });
};

// PUT /api/auth/me
exports.updateMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.name = req.body.name || user.name;
    user.phone = req.body.phone ?? user.phone;
    await user.save();
    res.json({ user: userResponse(user) });
  } catch (err) {
    next(err);
  }
};