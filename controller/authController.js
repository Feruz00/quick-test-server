const { User } = require('../models');
const { catchAsync } = require('../utils/catchAsync');
const { compare } = require('../utils/password');
const jwt = require('jsonwebtoken');

/**
 * CurrentUser
 */

exports.currentUser = catchAsync(async (req, res) => {
  res.status(200).json({
    data: req.user,
  });
});

/**
 * LOGIN
 */
exports.loginUser = catchAsync(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username } });

  if (!user || !(await compare(user.password, password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (!user.isActive) {
    return res.status(400).json({ message: 'Your account stopped' });
  }
  const cookieOptions = {
    httpOnly: true, // prevent XSS
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };
  const token = jwt.sign(
    { id: user.id, type: 'user' },
    process.env.JWT_SECRET,
    {
      expiresIn: '1d',
    }
  );

  res.cookie('jwt', token, cookieOptions);
  const userData = await user.toJSON();
  delete userData.password;
  res.status(200).json({
    status: 'success',
    token,
    data: userData,
  });
});

/**
 * LOGOUT
 */
exports.logoutUser = catchAsync(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});
