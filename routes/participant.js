const { myScore } = require('../controller/participateController');
const { protect, restrictTo } = require('../middleware/auth');

const router = require('express').Router();

router.use(protect, restrictTo('participant'));

router.route('/score/:join').get(myScore);

module.exports = router;
