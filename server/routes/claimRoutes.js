const express = require('express');
const {
  createClaim, getMyClaims, getReceivedClaims, getPendingCount, updateClaimStatus,
} = require('../controllers/claimController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // every claim route needs login

router.get('/mine', getMyClaims);
router.get('/received', getReceivedClaims);
router.get('/pending-count', getPendingCount);
router.post('/item/:itemId', createClaim);
router.patch('/:id/status', updateClaimStatus);

module.exports = router;