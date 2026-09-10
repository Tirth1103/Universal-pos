const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'universal_pos_multitenant_jwt_secret_key_2026_99x';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (userId, email, role) => {
  return jwt.sign(
    {
      id: userId.toString(),
      email,
      role: role || 'Store Admin'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateToken
};
