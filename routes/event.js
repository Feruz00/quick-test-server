const {
  getAllEvents,
  createEvent,
  getOneEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  startEvent,
  getEventByJoinCode,
  getResults,
  stopEvent,
} = require('../controller/eventsController');
const { protect, restrictTo } = require('../middleware/auth');

const router = require('express').Router();

router.post('/join/:code', joinEvent);
router.get('/code/:joinCode', getEventByJoinCode);

router.use(protect, restrictTo('manager'));
router.route('/').get(getAllEvents).post(createEvent);

router.route('/result/:id').get(getResults);
router
  .route('/:id')
  .get(getOneEvent)
  .patch(updateEvent)
  .delete(deleteEvent)
  .put(stopEvent);

router.route('/:id/start').patch(startEvent);

module.exports = router;
