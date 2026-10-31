const express = require('express');
const {
  getStats, getUsers, setBlocked, setRole, deleteUser, getItems,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('admin')); // admins only

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/block', setBlocked);
router.patch('/users/:id/role', setRole);
router.delete('/users/:id', deleteUser);
router.get('/items', getItems);

module.exports = router;
