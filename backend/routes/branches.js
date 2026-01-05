// =====================================================
// نظام إدارة المغاسل - API الفروع
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../database/mockData');

// جلب جميع الفروع
router.get('/', (req, res) => {
  try {
    const { laundry_id = 1 } = req.query;
    
    const branches = db.branches
      .filter(b => b.laundry_id == laundry_id)
      .map(branch => {
        const manager = db.users.find(u => u.id === branch.manager_id);
        const employees = db.users.filter(u => u.branch_id === branch.id);
        
        // حساب إحصائيات الفرع
        const branchInvoices = db.invoices.filter(inv => inv.branch_id === branch.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayInvoices = branchInvoices.filter(inv => new Date(inv.created_at) >= today);
        
        return {
          ...branch,
          manager_name: manager?.name || null,
          employees_count: employees.length,
          today_sales: todayInvoices.filter(i => i.payment_status === 'paid').reduce((sum, i) => sum + i.total, 0),
          today_orders: todayInvoices.length
        };
      });
    
    res.json({
      success: true,
      data: branches,
      total: branches.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب فرع واحد
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const branch = db.branches.find(b => b.id == id);
    
    if (!branch) {
      return res.status(404).json({ success: false, message: 'الفرع غير موجود' });
    }
    
    const manager = db.users.find(u => u.id === branch.manager_id);
    const employees = db.users.filter(u => u.branch_id == id);
    
    res.json({
      success: true,
      data: {
        ...branch,
        manager: manager || null,
        employees
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إضافة فرع جديد
router.post('/', (req, res) => {
  try {
    const { name, name_en, address, phone, email, manager_id, laundry_id = 1 } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ success: false, message: 'اسم الفرع والعنوان مطلوبان' });
    }
    
    const newBranch = {
      id: db.getNextId(db.branches),
      laundry_id: parseInt(laundry_id),
      name,
      name_en: name_en || name,
      address,
      phone: phone || null,
      email: email || null,
      manager_id: manager_id ? parseInt(manager_id) : null,
      working_hours: null,
      is_main: false,
      is_active: true,
      employees_count: 0
    };
    
    db.branches.push(newBranch);
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة الفرع بنجاح',
      data: newBranch
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تحديث فرع
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.branches.findIndex(b => b.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الفرع غير موجود' });
    }
    
    db.branches[index] = { ...db.branches[index], ...req.body };
    
    res.json({
      success: true,
      message: 'تم تحديث الفرع بنجاح',
      data: db.branches[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تفعيل/تعطيل فرع
router.patch('/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.branches.findIndex(b => b.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الفرع غير موجود' });
    }
    
    if (db.branches[index].is_main) {
      return res.status(400).json({ success: false, message: 'لا يمكن تعطيل الفرع الرئيسي' });
    }
    
    db.branches[index].is_active = !db.branches[index].is_active;
    
    res.json({
      success: true,
      message: db.branches[index].is_active ? 'تم تفعيل الفرع' : 'تم تعطيل الفرع',
      data: db.branches[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إحصائيات الفرع
router.get('/:id/stats', (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query;
    
    const branch = db.branches.find(b => b.id == id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'الفرع غير موجود' });
    }
    
    const branchInvoices = db.invoices.filter(inv => inv.branch_id == id);
    
    // تحديد الفترة
    let startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(1);
    }
    
    const periodInvoices = branchInvoices.filter(inv => new Date(inv.created_at) >= startDate);
    const paidInvoices = periodInvoices.filter(inv => inv.payment_status === 'paid');
    
    res.json({
      success: true,
      data: {
        total_invoices: periodInvoices.length,
        paid_invoices: paidInvoices.length,
        pending_invoices: periodInvoices.filter(i => i.status === 'pending').length,
        total_sales: paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
        total_tax: paidInvoices.reduce((sum, inv) => sum + inv.tax_amount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
