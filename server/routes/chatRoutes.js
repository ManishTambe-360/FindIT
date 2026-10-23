const express = require('express');
const {
  startConversation, getConversations, getUnreadCount, getMessages, markConversationRead, sendMessage,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.get('/unread-count', getUnreadCount); // must be above '/:id'
router.post('/item/:itemId', startConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.patch('/:id/read', markConversationRead);

module.exports = router;
