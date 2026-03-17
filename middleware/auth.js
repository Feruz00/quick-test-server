const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { User, Participant, Event } = require('../models');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1️⃣ Get token from header OR cookie

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.user) {
    token = req.cookies.user;
  }

  // 2️⃣ No token
  if (!token) {
    res.clearCookie('user', cookieOptions);

    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 3️⃣ Verify token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    res.clearCookie('user', cookieOptions);

    return next(
      new AppError('Token is invalid or expired. Please login again.', 401)
    );
  }
  let currentUser;
  if (decoded.type === 'user') {
    currentUser = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });
    currentUser = await currentUser.toJSON();
  } else if (decoded.type === 'participant') {
    currentUser = await Participant.findByPk(decoded.id, {
      include: [{ model: Event, as: 'event', attributes: ['join'] }],
    });
    currentUser = await currentUser.toJSON();
    currentUser.role = 'participant';
  } else {
    res.clearCookie('user', cookieOptions);
    return next(new AppError('Invalid token type. Please login again.', 401));
  }

  if (!currentUser) {
    res.clearCookie('user', cookieOptions);

    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  req.user = currentUser;

  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    return next();
  };
};

module.exports = { protect, restrictTo };
