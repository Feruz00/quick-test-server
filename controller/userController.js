const { Op, fn, col, literal } = require('sequelize');
const { User, Event } = require('../models');
const { catchAsync } = require('../utils/catchAsync');

/**
 * GET ALL
 */
exports.getAllUsers = catchAsync(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    username,
    isActive,
    sort = 'createdAt',
    order = 'DESC',
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 10;

  const offset = (page - 1) * limit;

  const options = {
    where: {
      id: {
        [Op.ne]: req.user.id,
      },
    },
    limit,
    offset,
    subQuery: false, // ⭐ IMPORTANT
    attributes: {
      exclude: ['password'],
      include: [[fn('COUNT', col('events.id')), 'eventsCount']],
    },
    include: [
      {
        model: Event,
        as: 'events',
        attributes: [],
      },
    ],
    group: ['User.id'],
  };

  if (username) {
    options.where = {
      ...options.where,
      [Op.or]: [
        {
          username: {
            [Op.like]: `%${username}%`,
          },
        },
        {
          fullName: {
            [Op.like]: `%${username}%`,
          },
        },
      ],
    };
  }

  if (isActive) {
    options.where.isActive = isActive === 'true';
  }

  const allowedSortFields = ['fullName', 'username', 'createdAt', 'role'];
  const allowedOrder = ['ASC', 'DESC'];

  if (!allowedSortFields.includes(sort)) sort = 'createdAt';
  if (!allowedOrder.includes(order.toUpperCase())) order = 'DESC';

  options.order = [[sort, order]];

  const { rows: users, count } = await User.findAndCountAll(options);

  res.status(200).json({
    data: users,
    count: Array.isArray(count) ? count.length : count,
  });
});

/**
 * GET ONE
 */
exports.getOneUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] },
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

/**
 * CREATE
 */
exports.createUser = catchAsync(async (req, res) => {
  const user = await User.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * UPDATE
 */
exports.updateUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.id === req.user.id) {
    return res.status(400).json({
      message: 'You cannot update own information',
    });
  }
  const { password, ...others } = req.body;
  let newUpdate = { ...others };
  if (password) {
    const newPassword = await toHash(password);
    newUpdate.password = newPassword;
  }
  await user.update(newUpdate);

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

/**
 * DELETE
 */
exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.id === req.user.id) {
    return res.status(400).json({
      message: 'You cannot delete own information',
    });
  }
  await user.destroy();

  res.status(204).json({
    status: 'success',
  });
});

/**
 * DELETE USERS
 */

exports.deleteUsers = catchAsync(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      message: 'Please provide an array of user IDs',
    });
  }

  if (ids.includes(req.user.id)) {
    return res.status(400).json({
      message: 'You cannot delete your own account',
    });
  }

  const adminUsers = await User.findAll({
    where: {
      id: { [Op.in]: ids },
      role: 'admin',
    },
  });

  if (adminUsers.length > 0) {
    return res.status(403).json({
      message: 'You cannot delete admin users',
    });
  }

  const deletedCount = await User.destroy({
    where: {
      id: { [Op.in]: ids },
    },
  });

  res.status(200).json({
    status: 'success',
    deleted: deletedCount,
  });
});
