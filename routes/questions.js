const {
  getSuffleQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestions,
  getQuestion,
  answerQuestion,
} = require('../controller/questionsController');
const { restrictTo, protect } = require('../middleware/auth');

const router = require('express').Router();

router.use(protect);

router.get(
  '/events/:join/shuffle',
  restrictTo('participant'),
  getSuffleQuestion
);

router.post('/answer/:questionId', restrictTo('participant'), answerQuestion);

router.use(restrictTo('manager'));
router.route('/events/:eventId').post(createQuestion).get(getQuestions);
router
  .route('/:id')
  .patch(updateQuestion)
  .delete(deleteQuestion)
  .get(getQuestion);

module.exports = router;
