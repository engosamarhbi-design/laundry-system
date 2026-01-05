// =====================================================
// نظام إدارة المغاسل - API رادار الاحتيال
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../database/mockData');

// جلب سجل التدقيق
router.get('/', (req, res) => {
  try {
    const { 
      laundry_id = 1, 
      branch_id, 
      user_id,
      action_type,
      risk_level,
      is_flagged,
      date_from,
      date_to,
      page = 1, 
      limit = 50 
    } = req.query;
    
    let logs = db.auditLogs.filter(log => log.laundry_id == laundry_id);
    
    // فلترة حسب الفرع
    if (branch_id) {
      logs = logs.filter(log => log.branch_id == branch_id);
    }
    
    // فلترة حسب المستخدم
    if (user_id) {
      logs = logs.filter(log => log.user_id == user_id);
    }
    
    // فلترة حسب نوع العملية
    if (action_type) {
      logs = logs.filter(log => log.action_type === action_type);
    }
    
    // فلترة حسب مستوى المخاطر
    if (risk_level) {
      logs = logs.filter(log => log.risk_level === risk_level);
    }
    
    // فلترة العمليات المشبوهة فقط
    if (is_flagged !== undefined) {
      logs = logs.filter(log => log.is_flagged === (is_flagged === 'true'));
    }
    
    // فلترة حسب التاريخ
    if (date_from) {
      logs = logs.filter(log => new Date(log.created_at) >= new Date(date_from));
    }
    if (date_to) {
      logs = logs.filter(log => new Date(log.created_at) <= new Date(date_to));
    }
    
    // ترتيب تنازلي حسب التاريخ
    logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // إضافة معلومات المستخدم والفرع
    const logsWithDetails = logs.map(log => {
      const user = db.users.find(u => u.id === log.user_id);
      const branch = db.branches.find(b => b.id === log.branch_id);
      
      return {
        ...log,
        user_name: user?.name || 'غير معروف',
        branch_name: branch?.name || ''
      };
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedLogs = logsWithDetails.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        total: logs.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(logs.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب سجل واحد
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const log = db.auditLogs.find(l => l.id == id);
    
    if (!log) {
      return res.status(404).json({ success: false, message: 'السجل غير موجود' });
    }
    
    const user = db.users.find(u => u.id === log.user_id);
    const branch = db.branches.find(b => b.id === log.branch_id);
    const reviewer = log.reviewed_by ? db.users.find(u => u.id === log.reviewed_by) : null;
    
    res.json({
      success: true,
      data: {
        ...log,
        user,
        branch,
        reviewer
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// مراجعة سجل (وضع علامة تمت المراجعة)
router.patch('/:id/review', (req, res) => {
  try {
    const { id } = req.params;
    const { reviewed_by = 1, notes } = req.body;
    const index = db.auditLogs.findIndex(l => l.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'السجل غير موجود' });
    }
    
    db.auditLogs[index].reviewed_by = reviewed_by;
    db.auditLogs[index].reviewed_at = new Date().toISOString();
    db.auditLogs[index].is_flagged = false;
    
    if (notes) {
      db.auditLogs[index].review_notes = notes;
    }
    
    res.json({
      success: true,
      message: 'تمت مراجعة السجل',
      data: db.auditLogs[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إضافة علامة على سجل
router.patch('/:id/flag', (req, res) => {
  try {
    const { id } = req.params;
    const { is_flagged = true } = req.body;
    const index = db.auditLogs.findIndex(l => l.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'السجل غير موجود' });
    }
    
    db.auditLogs[index].is_flagged = is_flagged;
    
    res.json({
      success: true,
      message: is_flagged ? 'تم وضع علامة على السجل' : 'تم إزالة العلامة',
      data: db.auditLogs[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إحصائيات رادار الاحتيال
router.get('/stats/overview', (req, res) => {
  try {
    const { laundry_id = 1 } = req.query;
    
    const logs = db.auditLogs.filter(l => l.laundry_id == laundry_id);
    
    // إحصائيات حسب مستوى المخاطر
    const byRiskLevel = {
      low: logs.filter(l => l.risk_level === 'low').length,
      medium: logs.filter(l => l.risk_level === 'medium').length,
      high: logs.filter(l => l.risk_level === 'high').length,
      critical: logs.filter(l => l.risk_level === 'critical').length
    };
    
    // إحصائيات حسب نوع العملية
    const byActionType = {};
    logs.forEach(log => {
      byActionType[log.action_type] = (byActionType[log.action_type] || 0) + 1;
    });
    
    // العمليات المشبوهة غير المراجعة
    const unreviewedFlagged = logs.filter(l => l.is_flagged && !l.reviewed_at);
    
    // آخر 7 أيام
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentLogs = logs.filter(l => new Date(l.created_at) >= lastWeek);
    
    res.json({
      success: true,
      data: {
        total_logs: logs.length,
        flagged: logs.filter(l => l.is_flagged).length,
        unreviewed: unreviewedFlagged.length,
        by_risk_level: byRiskLevel,
        by_action_type: byActionType,
        recent_count: recentLogs.length,
        recent_flagged: recentLogs.filter(l => l.is_flagged).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// أنواع العمليات
router.get('/types/list', (req, res) => {
  res.json({
    success: true,
    data: [
      { value: 'create', label: 'إنشاء', label_en: 'Create' },
      { value: 'update', label: 'تعديل', label_en: 'Update' },
      { value: 'delete', label: 'حذف', label_en: 'Delete' },
      { value: 'price_change', label: 'تغيير سعر', label_en: 'Price Change' },
      { value: 'discount_change', label: 'تغيير خصم', label_en: 'Discount Change' },
      { value: 'tax_change', label: 'تغيير ضريبة', label_en: 'Tax Change' },
      { value: 'invoice_cancel', label: 'إلغاء فاتورة', label_en: 'Invoice Cancel' },
      { value: 'invoice_modify', label: 'تعديل فاتورة', label_en: 'Invoice Modify' },
      { value: 'refund', label: 'استرجاع', label_en: 'Refund' },
      { value: 'login', label: 'تسجيل دخول', label_en: 'Login' },
      { value: 'logout', label: 'تسجيل خروج', label_en: 'Logout' }
    ]
  });
});

module.exports = router;
