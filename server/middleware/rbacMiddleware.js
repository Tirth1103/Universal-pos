// RBAC Middleware: Authorize specific roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const role = req.user.role || 'Store Admin';
    if (!allowedRoles.includes(role) && role !== 'Store Admin') {
      return res.status(403).json({
        success: false,
        message: `Role "${role}" is not authorized to access this resource`
      });
    }

    next();
  };
};

module.exports = {
  authorize
};
