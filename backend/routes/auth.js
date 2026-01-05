// =====================================================
// نظام إدارة المغاسل - API المصادقة مع JWT
// =====================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/mockData');
const { generateToken, verifyToken, authMiddleware } = require('../middleware/auth');

// =====================================================
// تسجيل الدخول
// =====================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
      });
    }
    
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }
    
    // للتطوير: كلمة المرور الافتراضية = password123
    const isValidPassword = password === 'password123' || password === user.password_hash;
    
    if (!isValidPassword) {
      try {
        const bcryptValid = await bcrypt.compare(password, user.password_hash);
        if (!bcryptValid) {
          return res.status(401).json({
            success: false,
            message: 'بيانات الدخول غير صحيحة'
          });
        }
      } catch {
        return res.status(401).json({
          success: false,
          message: 'بيانات الدخول غير صحيحة'
        });
      }
    }
    
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'الحساب معطل - تواصل مع المسؤول'
      });
    }
    
    // تحديث آخر دخول
    const userIndex = db.users.findIndex(u => u.id === user.id);
    db.users[userIndex].last_login = new Date().toISOString();
    
    const role = db.roles.find(r => r.id === user.role_id);
    const branch = db.branches.find(b => b.id === user.branch_id);
    
    const token = generateToken(user);
    
    // تسجيل في سجل التدقيق
    db.auditLogs.push({
      id: db.getNextId(db.auditLogs),
      laundry_id: user.laundry_id,
      branch_id: user.branch_id,
      user_id: user.id,
      action_type: 'login',
      entity_type: 'user',
      entity_id: user.id,
      description: `تسجيل دخول: ${user.name}`,
      risk_level: 'low',
      is_flagged: false,
      created_at: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: {
            id: role?.id,
            name: role?.name,
            name_en: role?.name_en,
            permissions: role?.permissions
          },
          branch: branch ? {
            id: branch.id,
            name: branch.name
          } : null,
          laundry_id: user.laundry_id
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تسجيل الدخول'
    });
  }
});

// =====================================================
// تسجيل مغسلة جديدة
// =====================================================
router.post('/register', async (req, res) => {
  try {
    const { laundry_name, owner_name, email, phone, password } = req.body;
    
    if (!laundry_name || !owner_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }
    
    const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مسجل مسبقاً'
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // إنشاء المغسلة
    const newLaundryId = 2; // في الواقع سيكون auto increment
    
    // إنشاء دور المالك
    const newRoleId = db.getNextId(db.roles);
    db.roles.push({
      id: newRoleId,
      laundry_id: newLaundryId,
      name: 'مالك',
      name_en: 'Owner',
      is_system: true,
      permissions: { all: true }
    });
    
    // إنشاء الفرع الرئيسي
    const newBranchId = db.getNextId(db.branches);
    db.branches.push({
      id: newBranchId,
      laundry_id: newLaundryId,
      name: 'الفرع الرئيسي',
      name_en: 'Main Branch',
      phone: phone,
      is_main: true,
      is_active: true,
      employees_count: 1
    });
    
    // إنشاء المستخدم
    const newUserId = db.getNextId(db.users);
    const newUser = {
      id: newUserId,
      laundry_id: newLaundryId,
      branch_id: null,
      role_id: newRoleId,
      name: owner_name,
      email: email,
      phone: phone,
      password_hash: hashedPassword,
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    db.users.push(newUser);
    
    const token = generateToken(newUser);
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب - فترتك التجريبية 14 يوم',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: { id: newRoleId, name: 'مالك', permissions: { all: true } },
          laundry_id: newLaundryId,
          trial_ends: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء الحساب'
    });
  }
});

// =====================================================
// تسجيل الخروج
// =====================================================
router.post('/logout', authMiddleware, (req, res) => {
  db.auditLogs.push({
    id: db.getNextId(db.auditLogs),
    laundry_id: req.user.laundry_id,
    user_id: req.user.id,
    action_type: 'logout',
    description: 'تسجيل خروج',
    risk_level: 'low',
    is_flagged: false,
    created_at: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

// =====================================================
// التحقق من التوكن
// =====================================================
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, valid: false });
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ success: false, valid: false });
  }
  
  res.json({
    success: true,
    valid: true,
    data: { user_id: decoded.id, expires: new Date(decoded.exp * 1000).toISOString() }
  });
});

// =====================================================
// جلب المستخدم الحالي
// =====================================================
router.get('/me', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
  }
  
  const role = db.roles.find(r => r.id === user.role_id);
  const branch = db.branches.find(b => b.id === user.branch_id);
  
  res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: { id: role?.id, name: role?.name, name_en: role?.name_en, permissions: role?.permissions },
      branch: branch ? { id: branch.id, name: branch.name } : null,
      laundry_id: user.laundry_id
    }
  });
});

// =====================================================
// تحديث الملف الشخصي
// =====================================================
router.put('/profile', authMiddleware, (req, res) => {
  const { name, phone } = req.body;
  const userIndex = db.users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
  }
  
  if (name) db.users[userIndex].name = name;
  if (phone) db.users[userIndex].phone = phone;
  
  res.json({
    success: true,
    message: 'تم تحديث الملف الشخصي',
    data: { name: db.users[userIndex].name, phone: db.users[userIndex].phone }
  });
});

// =====================================================
// تغيير كلمة المرور
// =====================================================
router.put('/change-password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  
  if (!current_password || !new_password) {
    return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
  }
  
  if (new_password.length < 6) {
    return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
  }
  
  const userIndex = db.users.findIndex(u => u.id === req.user.id);
  const user = db.users[userIndex];
  
  const isValid = current_password === 'password123' || current_password === user.password_hash;
  if (!isValid) {
    return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
  }
  
  const salt = await bcrypt.genSalt(10);
  db.users[userIndex].password_hash = await bcrypt.hash(new_password, salt);
  
  res.json({ success: true, message: 'تم تغيير كلمة المرور' });
});

// =====================================================
// تحديث التوكن
// =====================================================
router.post('/refresh', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  
  if (!user || !user.is_active) {
    return res.status(401).json({ success: false, message: 'المستخدم غير موجود أو معطل' });
  }
  
  const newToken = generateToken(user);
  res.json({ success: true, data: { token: newToken } });
});

module.exports = router;
