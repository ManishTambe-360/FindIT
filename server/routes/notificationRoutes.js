const express = require('express');
const {
  getNotifications, getUnreadCount, markAllRead, markRead, deleteNotification, clearRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead); // must be above '/:id'
router.delete('/', clearRead);
router.patch('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;
