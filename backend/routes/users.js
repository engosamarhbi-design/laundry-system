// =====================================================
// نظام إدارة المغاسل - API المستخدمين والصلاحيات
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../database/mockData');

// =====================================================
// المستخدمين
// =====================================================

// جلب جميع المستخدمين
router.get('/', (req, res) => {
  try {
    const { laundry_id = 1, branch_id, role_id, is_active } = req.query;
    
    let users = db.users.filter(u => u.laundry_id == laundry_id);
    
    if (branch_id) {
      users = users.filter(u => u.branch_id == branch_id);
    }
    
    if (role_id) {
      users = users.filter(u => u.role_id == role_id);
    }
    
    if (is_active !== undefined) {
      users = users.filter(u => u.is_active === (is_active === 'true'));
    }
    
    // إضافة معلومات الدور والفرع
    const usersWithDetails = users.map(user => {
      const role = db.roles.find(r => r.id === user.role_id);
      const branch = db.branches.find(b => b.id === user.branch_id);
      
      return {
        ...user,
        role_name: role?.name || '',
        role_name_en: role?.name_en || '',
        branch_name: branch?.name || 'جميع الفروع',
        password_hash: undefined // لا نرسل كلمة المرور
      };
    });
    
    res.json({
      success: true,
      data: usersWithDetails,
      total: usersWithDetails.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب مستخدم واحد
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.users.find(u => u.id == id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    const role = db.roles.find(r => r.id === user.role_id);
    const branch = db.branches.find(b => b.id === user.branch_id);
    
    res.json({
      success: true,
      data: {
        ...user,
        role,
        branch,
        password_hash: undefined
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إضافة مستخدم جديد
router.post('/', (req, res) => {
  try {
    const { name, email, phone, password, role_id, branch_id, laundry_id = 1 } = req.body;
    
    if (!name || !email || !password || !role_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'الاسم والإيميل وكلمة المرور والدور مطلوبين' 
      });
    }
    
    // التحقق من تكرار الإيميل
    const existingUser = db.users.find(u => u.email === email && u.laundry_id == laundry_id);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً' });
    }
    
    const newUser = {
      id: db.getNextId(db.users),
      laundry_id: parseInt(laundry_id),
      branch_id: branch_id ? parseInt(branch_id) : null,
      role_id: parseInt(role_id),
      name,
      email,
      phone: phone || null,
      password_hash: password, // في الواقع يجب تشفير كلمة المرور
      avatar: null,
      is_active: true,
      last_login: null,
      created_at: new Date().toISOString()
    };
    
    db.users.push(newUser);
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة المستخدم بنجاح',
      data: { ...newUser, password_hash: undefined }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تحديث مستخدم
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.users.findIndex(u => u.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    // عدم السماح بتعديل كلمة المرور هنا
    const { password, password_hash, ...updateData } = req.body;
    
    db.users[index] = { 
      ...db.users[index], 
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      data: { ...db.users[index], password_hash: undefined }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تفعيل/تعطيل مستخدم
router.patch('/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.users.findIndex(u => u.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    // لا يمكن تعطيل المالك
    const role = db.roles.find(r => r.id === db.users[index].role_id);
    if (role?.name === 'مالك') {
      return res.status(400).json({ success: false, message: 'لا يمكن تعطيل حساب المالك' });
    }
    
    db.users[index].is_active = !db.users[index].is_active;
    
    res.json({
      success: true,
      message: db.users[index].is_active ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم',
      data: { ...db.users[index], password_hash: undefined }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تغيير كلمة المرور
router.patch('/:id/password', (req, res) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;
    const index = db.users.findIndex(u => u.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    // في الواقع يجب التحقق من كلمة المرور الحالية
    db.users[index].password_hash = new_password;
    
    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================================
// الأدوار
// =====================================================

// جلب جميع الأدوار
router.get('/roles/list', (req, res) => {
  try {
    const { laundry_id = 1 } = req.query;
    
    const roles = db.roles.filter(r => r.laundry_id == laundry_id);
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إضافة دور جديد
router.post('/roles', (req, res) => {
  try {
    const { name, name_en, permissions, laundry_id = 1 } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'اسم الدور مطلوب' });
    }
    
    const newRole = {
      id: db.getNextId(db.roles),
      laundry_id: parseInt(laundry_id),
      name,
      name_en: name_en || name,
      permissions: permissions || {},
      is_system: false
    };
    
    db.roles.push(newRole);
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة الدور بنجاح',
      data: newRole
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تحديث دور
router.put('/roles/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.roles.findIndex(r => r.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الدور غير موجود' });
    }
    
    if (db.roles[index].is_system) {
      // السماح فقط بتعديل الصلاحيات للأدوار النظامية
      const { permissions } = req.body;
      if (permissions) {
        db.roles[index].permissions = permissions;
      }
    } else {
      db.roles[index] = { ...db.roles[index], ...req.body };
    }
    
    res.json({
      success: true,
      message: 'تم تحديث الدور بنجاح',
      data: db.roles[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// حذف دور
router.delete('/roles/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.roles.findIndex(r => r.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الدور غير موجود' });
    }
    
    if (db.roles[index].is_system) {
      return res.status(400).json({ success: false, message: 'لا يمكن حذف دور نظامي' });
    }
    
    // التحقق من وجود مستخدمين بهذا الدور
    const usersWithRole = db.users.filter(u => u.role_id == id);
    if (usersWithRole.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف الدور لوجود ${usersWithRole.length} مستخدم مرتبط به` 
      });
    }
    
    db.roles.splice(index, 1);
    
    res.json({
      success: true,
      message: 'تم حذف الدور بنجاح'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
