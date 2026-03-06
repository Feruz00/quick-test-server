const {
  getAllUsers,
  createUser,
  deleteUsers,
  getOneUser,
  updateUser,
  deleteUser,
} = require('../controller/userController');
const { protect, restrictTo } = require('../middleware/auth');

const router = require('express').Router();

router.use(protect, restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser).delete(deleteUsers);

router.route('/:id').get(getOneUser).patch(updateUser).delete(deleteUser);

module.exports = router;
