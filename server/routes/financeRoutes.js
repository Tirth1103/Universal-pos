const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAccounts,
  createAccount,
  transferFunds,
  getExpenses,
  createExpense,
  getCheques,
  createCheque,
  updateChequeStatus
} = require('../controllers/financeController');

router.use(protect);

router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);
router.post('/accounts/transfer', transferFunds);

router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);

router.get('/cheques', getCheques);
router.post('/cheques', createCheque);
router.put('/cheques/:id/status', updateChequeStatus);

module.exports = router;
