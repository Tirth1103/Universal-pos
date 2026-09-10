const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  getUsers,
  register,
  logout,
  updateStore
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.put('/store', protect, updateStore);
router.get('/users', protect, getUsers);
router.post('/logout', logout);

module.exports = router;
