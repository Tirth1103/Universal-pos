const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const { generateToken } = require('../config/jwt');

// In-memory fallback
let memoryUsers = [];

// Helper: Seed Default Store Admin if database is empty
const seedAdminIfEmpty = async () => {
  if (!getIsConnected()) return;
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('[MongoDB Auth] No users found. Initializing primary store admin...');
      await User.create({
        name: 'Store Owner',
        email: 'admin@pos.local',
        password: 'password123',
        storeName: 'My Retail Flagship',
        storeLogo: '',
        storeCategory: 'General Retail',
        role: 'Store Admin',
        employeeId: 'ADM-001',
        storeBranch: 'Main Branch',
        themeColors: {
          primary: '#10b981',
          accent: '#047857',
          isCustom: false
        }
      });
      console.log('[MongoDB Auth] Default store admin initialized: admin@pos.local');
    }
  } catch (err) {
    console.error('[MongoDB Auth Error] Failed to seed initial users:', err.message);
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, storeName, storeLogo = '', storeCategory = 'General Retail', role, employeeId, storeBranch, themeColors } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const storeTitle = (storeName && storeName.trim()) || `${name.trim()}'s Store`;

    if (getIsConnected()) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email is already registered.'
        });
      }

      const newUser = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        storeName: storeTitle,
        storeLogo: storeLogo || '',
        storeCategory: storeCategory.trim() || 'General Retail',
        role: role || 'Store Admin',
        employeeId: employeeId || `EMP-${Date.now().toString().slice(-4)}`,
        storeBranch: storeBranch || 'Main Branch',
        themeColors: themeColors || {
          primary: '#10b981',
          accent: '#047857',
          isCustom: false
        }
      });

      const token = generateToken(newUser._id, newUser.email, newUser.role);
      const safeUser = newUser.toSafeObject();

      return res.status(201).json({
        success: true,
        message: `Welcome, ${newUser.name}! Store account registered successfully.`,
        token,
        data: {
          user: safeUser,
          token
        }
      });
    } else {
      // In-Memory Fallback
      const existing = memoryUsers.find(u => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email is already registered.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = `user-${Date.now()}`;
      const newUser = {
        id: userId,
        _id: userId,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        storeName: storeTitle,
        storeLogo: storeLogo || '',
        storeCategory: storeCategory.trim() || 'General Retail',
        role: role || 'Store Admin',
        employeeId: employeeId || `EMP-${Date.now().toString().slice(-4)}`,
        storeBranch: storeBranch || 'Main Branch',
        themeColors: themeColors || {
          primary: '#10b981',
          accent: '#047857',
          isCustom: false
        },
        status: 'Active',
        createdAt: new Date()
      };
      memoryUsers.push(newUser);

      const token = generateToken(userId, cleanEmail, newUser.role);
      const safeUser = { ...newUser };
      delete safeUser.password;

      return res.status(201).json({
        success: true,
        message: `Welcome, ${newUser.name}! Store account registered successfully.`,
        token,
        data: {
          user: safeUser,
          token
        },
        isMemory: true
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (getIsConnected()) {
      const user = await User.findOne({ email: cleanEmail });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. No store account found with this email.'
        });
      }

      if (user.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password. Please try again.'
        });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id, user.email, user.role);
      const safeUser = user.toSafeObject();

      return res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        token,
        data: {
          user: safeUser,
          token
        }
      });
    } else {
      // In-Memory Fallback
      const user = memoryUsers.find(u => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. No store account found with this email.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch && user.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password. Please try again.'
        });
      }

      user.lastLogin = new Date();
      const token = generateToken(user._id || user.id, user.email, user.role);
      const safeUser = { ...user };
      delete safeUser.password;

      return res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        token,
        data: {
          user: safeUser,
          token
        },
        isMemory: true
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me (Protected Route)
const getMe = async (req, res) => {
  try {
    if (req.user) {
      return res.json({ success: true, data: req.user });
    }

    if (getIsConnected()) {
      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.json({ success: true, data: user.toSafeObject() });
    } else {
      const user = memoryUsers.find(u => u.id === req.userId || u._id === req.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const safeUser = { ...user };
      delete safeUser.password;
      return res.json({ success: true, data: safeUser, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/users
const getUsers = async (req, res) => {
  try {
    if (getIsConnected()) {
      const users = await User.find({}).sort({ createdAt: -1 });
      return res.json({ success: true, data: users.map(u => u.toSafeObject()) });
    } else {
      const users = memoryUsers.map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });
      return res.json({ success: true, data: users, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
};

// PUT /api/auth/store (Update store branding & details)
const updateStore = async (req, res) => {
  try {
    const userId = req.userId;
    const { storeName, storeLogo, storeCategory, storeBranch, name, themeColors } = req.body;

    const updates = {};
    if (storeName !== undefined) updates.storeName = storeName.trim();
    if (storeLogo !== undefined) updates.storeLogo = storeLogo;
    if (storeCategory !== undefined) updates.storeCategory = storeCategory.trim();
    if (storeBranch !== undefined) updates.storeBranch = storeBranch.trim();
    if (name !== undefined) updates.name = name.trim();
    if (themeColors !== undefined) updates.themeColors = themeColors;

    if (getIsConnected()) {
      const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.json({ success: true, message: 'Store branding updated successfully', data: user.toSafeObject() });
    } else {
      const user = memoryUsers.find(u => u.id === userId || u._id === userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      Object.assign(user, updates);
      const safeUser = { ...user };
      delete safeUser.password;
      return res.json({ success: true, message: 'Store branding updated successfully', data: safeUser, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  login,
  getMe,
  getUsers,
  register,
  logout,
  updateStore,
  seedAdminIfEmpty,
  memoryUsers
};
