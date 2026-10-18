const express = require('express');
const {
  createItem, getItems, getMyItems, getItem, updateItem, updateStatus, deleteItem,
} = require('../controllers/itemController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getItems);
router.get('/mine', protect, getMyItems); // must be above '/:id'
router.get('/:id', optionalAuth, getItem);

router.post('/', protect, upload.array('images', 4), createItem);
router.put('/:id', protect, upload.array('images', 4), updateItem);
router.patch('/:id/status', protect, updateStatus);
router.delete('/:id', protect, deleteItem);

module.exports = router;