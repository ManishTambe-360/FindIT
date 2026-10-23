const express = require('express');
const {
  getItemMatches, refreshItemMatches, getMyMatchCounts, dismissMatch,
} = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // matches are private to the poster

router.get('/mine', getMyMatchCounts);
router.get('/item/:itemId', getItemMatches);
router.post('/item/:itemId/refresh', refreshItemMatches);
router.patch('/:id/dismiss', dismissMatch);

module.exports = router;
