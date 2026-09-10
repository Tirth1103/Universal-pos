const Customer = require('../models/Customer');
const { getIsConnected } = require('../config/db');

let memoryCustomers = [];

// GET /api/customers (Scoped strictly to authenticated user's store)
const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.userId;

    if (getIsConnected()) {
      let query = { userId };

      if (search) {
        query.$and = [
          { userId },
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { phone: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
            ]
          }
        ];
        delete query.userId;
      }

      const customers = await Customer.find(query).sort({ totalSpent: -1 });
      return res.json({ success: true, count: customers.length, data: customers });
    } else {
      let list = memoryCustomers.filter(c => c.userId && c.userId.toString() === userId);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
        );
      }
      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const userId = req.userId;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
    }

    const cleanPhone = phone.trim();

    if (getIsConnected()) {
      const existing = await Customer.findOne({ phone: cleanPhone, userId });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Customer with this phone number already exists in your store' });
      }

      const newCust = await Customer.create({
        userId,
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : ''
      });
      return res.status(201).json({ success: true, data: newCust });
    } else {
      const existing = memoryCustomers.find(c => c.phone === cleanPhone && c.userId && c.userId.toString() === userId);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Customer with this phone number already exists in your store' });
      }

      const newCust = {
        id: `cust-${Date.now()}`,
        _id: `cust-${Date.now()}`,
        userId,
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : '',
        loyaltyPoints: 0,
        totalSpent: 0,
        totalOrders: 0,
        tier: 'Bronze',
        createdAt: new Date().toISOString()
      };
      memoryCustomers.unshift(newCust);
      return res.status(201).json({ success: true, data: newCust });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  memoryCustomers
};
