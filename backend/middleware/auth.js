// =====================================================
// نظام إدارة المغاسل - Middleware التحقق من JWT
// =====================================================

const jwt = require('jsonwebtoken');

// المفتاح السري (في الإنتاج يجب وضعه في متغيرات البيئة)
const JWT_SECRET = process.env.JWT_SECRET || 'laundry-system-secret-key-2024';
const JWT_EXPIRES_IN = '7d'; // صلاحية التوكن 7 أيام

// توليد التوكن
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      laundry_id: user.laundry_id,
      role_id: user.role_id,
      branch_id: user.branch_id
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// التحقق من التوكن
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware للتحقق من المصادقة
const authMiddleware = (req, res, next) => {
  try {
    // الحصول على التوكن من الهيدر
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح - يرجى تسجيل الدخول'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'جلسة منتهية - يرجى تسجيل الدخول مرة أخرى'
      });
    }
    
    // إضافة بيانات المستخدم للطلب
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'خطأ في المصادقة'
    });
  }
};

// Middleware للتحقق من الصلاحيات
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }
    
    // role_id: 1 = مالك، 2 = مدير، 3 = كاشير، 4 = موظف
    const roleId = req.user.role_id;
    
    // المالك لديه كل الصلاحيات
    if (roleId === 1) {
      return next();
    }
    
    if (!allowedRoles.includes(roleId)) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول لهذا المورد'
      });
    }
    
    next();
  };
};

// Middleware للتحقق من ملكية المغسلة
const requireLaundryAccess = (req, res, next) => {
  const requestedLaundryId = req.query.laundry_id || req.body.laundry_id || req.params.laundry_id;
  
  if (requestedLaundryId && requestedLaundryId != req.user.laundry_id) {
    return res.status(403).json({
      success: false,
      message: 'لا يمكنك الوصول لبيانات مغسلة أخرى'
    });
  }
  
  // إضافة laundry_id تلقائياً للطلب
  req.query.laundry_id = req.user.laundry_id;
  if (req.body) {
    req.body.laundry_id = req.user.laundry_id;
  }
  
  next();
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateToken,
  verifyToken,
  authMiddleware,
  requireRole,
  requireLaundryAccess
};
