const express = require('express');
const router = express.Router();
const {
  getCoupons,
  createCoupon,
  validateCoupon,
  toggleCouponStatus,
  deleteCoupon
} = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getCoupons)
  .post(createCoupon);

router.post('/validate', validateCoupon);
router.put('/:id/toggle', toggleCouponStatus);
router.delete('/:id', deleteCoupon);

module.exports = router;
