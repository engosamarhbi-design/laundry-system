// =====================================================
// نظام إدارة المغاسل - API الاشتراكات
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../database/mockData');

// =====================================================
// باقات الاشتراكات
// =====================================================

// جلب جميع الباقات
router.get('/plans', (req, res) => {
  try {
    const { laundry_id = 1, is_active } = req.query;
    
    let plans = db.subscriptionPlans.filter(p => p.laundry_id == laundry_id);
    
    if (is_active !== undefined) {
      plans = plans.filter(p => p.is_active === (is_active === 'true'));
    }
    
    // إضافة عدد المشتركين لكل باقة
    const plansWithStats = plans.map(plan => {
      const subscribers = db.customerSubscriptions.filter(
        s => s.plan_id === plan.id && s.status === 'active'
      );
      return {
        ...plan,
        subscribers_count: subscribers.length
      };
    });
    
    res.json({
      success: true,
      data: plansWithStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب باقة واحدة
router.get('/plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const plan = db.subscriptionPlans.find(p => p.id == id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'الباقة غير موجودة' });
    }
    
    const subscribers = db.customerSubscriptions.filter(
      s => s.plan_id == id && s.status === 'active'
    );
    
    res.json({
      success: true,
      data: {
        ...plan,
        subscribers_count: subscribers.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إضافة باقة جديدة
router.post('/plans', (req, res) => {
  try {
    const {
      name,
      name_en,
      description,
      price,
      duration_days = 30,
      items_limit,
      kg_limit,
      discount_percent = 0,
      laundry_id = 1
    } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'اسم الباقة والسعر مطلوبان' });
    }
    
    const newPlan = {
      id: db.getNextId(db.subscriptionPlans),
      laundry_id: parseInt(laundry_id),
      name,
      name_en: name_en || name,
      description: description || '',
      price: parseFloat(price),
      duration_days: parseInt(duration_days),
      items_limit: items_limit ? parseInt(items_limit) : null,
      kg_limit: kg_limit ? parseFloat(kg_limit) : null,
      discount_percent: parseFloat(discount_percent),
      is_active: true
    };
    
    db.subscriptionPlans.push(newPlan);
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة الباقة بنجاح',
      data: newPlan
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تحديث باقة
router.put('/plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.subscriptionPlans.findIndex(p => p.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الباقة غير موجودة' });
    }
    
    db.subscriptionPlans[index] = { ...db.subscriptionPlans[index], ...req.body };
    
    res.json({
      success: true,
      message: 'تم تحديث الباقة بنجاح',
      data: db.subscriptionPlans[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تفعيل/تعطيل باقة
router.patch('/plans/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.subscriptionPlans.findIndex(p => p.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الباقة غير موجودة' });
    }
    
    db.subscriptionPlans[index].is_active = !db.subscriptionPlans[index].is_active;
    
    res.json({
      success: true,
      message: db.subscriptionPlans[index].is_active ? 'تم تفعيل الباقة' : 'تم تعطيل الباقة',
      data: db.subscriptionPlans[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================================
// اشتراكات العملاء
// =====================================================

// جلب جميع اشتراكات العملاء
router.get('/', (req, res) => {
  try {
    const { laundry_id = 1, status, customer_id, plan_id } = req.query;
    
    let subscriptions = db.customerSubscriptions;
    
    // فلترة حسب الحالة
    if (status) {
      subscriptions = subscriptions.filter(s => s.status === status);
    }
    
    // فلترة حسب العميل
    if (customer_id) {
      subscriptions = subscriptions.filter(s => s.customer_id == customer_id);
    }
    
    // فلترة حسب الباقة
    if (plan_id) {
      subscriptions = subscriptions.filter(s => s.plan_id == plan_id);
    }
    
    // إضافة معلومات العميل والباقة
    const subscriptionsWithDetails = subscriptions.map(sub => {
      const customer = db.customers.find(c => c.id === sub.customer_id);
      const plan = db.subscriptionPlans.find(p => p.id === sub.plan_id);
      const branch = db.branches.find(b => b.id === sub.branch_id);
      
      // حساب الأيام المتبقية
      const endDate = new Date(sub.end_date);
      const today = new Date();
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        ...sub,
        customer_name: customer?.name || '',
        customer_phone: customer?.phone || '',
        plan_name: plan?.name || '',
        plan_items_limit: plan?.items_limit || 0,
        branch_name: branch?.name || '',
        days_remaining: daysRemaining,
        items_remaining: plan?.items_limit ? plan.items_limit - sub.items_used : null,
        usage_percent: plan?.items_limit ? Math.round((sub.items_used / plan.items_limit) * 100) : 0
      };
    });
    
    // فلترة حسب المغسلة
    const filteredSubscriptions = subscriptionsWithDetails.filter(sub => {
      const customer = db.customers.find(c => c.id === sub.customer_id);
      return customer?.laundry_id == laundry_id;
    });
    
    res.json({
      success: true,
      data: filteredSubscriptions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إنشاء اشتراك جديد لعميل
router.post('/', (req, res) => {
  try {
    const { customer_id, plan_id, branch_id } = req.body;
    
    if (!customer_id || !plan_id) {
      return res.status(400).json({ success: false, message: 'العميل والباقة مطلوبان' });
    }
    
    // التحقق من العميل
    const customer = db.customers.find(c => c.id == customer_id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }
    
    // التحقق من الباقة
    const plan = db.subscriptionPlans.find(p => p.id == plan_id);
    if (!plan || !plan.is_active) {
      return res.status(404).json({ success: false, message: 'الباقة غير موجودة أو غير نشطة' });
    }
    
    // التحقق من عدم وجود اشتراك نشط
    const existingSubscription = db.customerSubscriptions.find(
      s => s.customer_id == customer_id && s.status === 'active'
    );
    if (existingSubscription) {
      return res.status(400).json({ success: false, message: 'العميل لديه اشتراك نشط بالفعل' });
    }
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);
    
    const newSubscription = {
      id: db.getNextId(db.customerSubscriptions),
      customer_id: parseInt(customer_id),
      plan_id: parseInt(plan_id),
      branch_id: branch_id ? parseInt(branch_id) : null,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      items_used: 0,
      kg_used: 0,
      status: 'active'
    };
    
    db.customerSubscriptions.push(newSubscription);
    
    // ترقية العميل إلى VIP
    const customerIndex = db.customers.findIndex(c => c.id == customer_id);
    if (customerIndex !== -1) {
      db.customers[customerIndex].is_vip = true;
    }
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الاشتراك بنجاح',
      data: newSubscription
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// استخدام من الاشتراك
router.post('/:id/use', (req, res) => {
  try {
    const { id } = req.params;
    const { items = 0, kg = 0 } = req.body;
    const index = db.customerSubscriptions.findIndex(s => s.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الاشتراك غير موجود' });
    }
    
    const subscription = db.customerSubscriptions[index];
    
    if (subscription.status !== 'active') {
      return res.status(400).json({ success: false, message: 'الاشتراك غير نشط' });
    }
    
    const plan = db.subscriptionPlans.find(p => p.id === subscription.plan_id);
    
    // التحقق من الحد المتاح
    if (plan.items_limit && (subscription.items_used + items) > plan.items_limit) {
      return res.status(400).json({ 
        success: false, 
        message: `تجاوز الحد المسموح. المتبقي: ${plan.items_limit - subscription.items_used} قطعة` 
      });
    }
    
    db.customerSubscriptions[index].items_used += items;
    db.customerSubscriptions[index].kg_used += kg;
    
    res.json({
      success: true,
      message: 'تم تحديث الاستخدام',
      data: {
        ...db.customerSubscriptions[index],
        items_remaining: plan.items_limit ? plan.items_limit - db.customerSubscriptions[index].items_used : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إلغاء اشتراك
router.patch('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.customerSubscriptions.findIndex(s => s.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الاشتراك غير موجود' });
    }
    
    db.customerSubscriptions[index].status = 'cancelled';
    
    res.json({
      success: true,
      message: 'تم إلغاء الاشتراك',
      data: db.customerSubscriptions[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تجديد اشتراك
router.post('/:id/renew', (req, res) => {
  try {
    const { id } = req.params;
    const subscription = db.customerSubscriptions.find(s => s.id == id);
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'الاشتراك غير موجود' });
    }
    
    const plan = db.subscriptionPlans.find(p => p.id === subscription.plan_id);
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);
    
    const newSubscription = {
      id: db.getNextId(db.customerSubscriptions),
      customer_id: subscription.customer_id,
      plan_id: subscription.plan_id,
      branch_id: subscription.branch_id,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      items_used: 0,
      kg_used: 0,
      status: 'active'
    };
    
    // إلغاء الاشتراك القديم
    const oldIndex = db.customerSubscriptions.findIndex(s => s.id == id);
    db.customerSubscriptions[oldIndex].status = 'expired';
    
    db.customerSubscriptions.push(newSubscription);
    
    res.status(201).json({
      success: true,
      message: 'تم تجديد الاشتراك بنجاح',
      data: newSubscription
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إحصائيات الاشتراكات
router.get('/stats/overview', (req, res) => {
  try {
    const { laundry_id = 1 } = req.query;
    
    const plans = db.subscriptionPlans.filter(p => p.laundry_id == laundry_id);
    const subscriptions = db.customerSubscriptions.filter(sub => {
      const customer = db.customers.find(c => c.id === sub.customer_id);
      return customer?.laundry_id == laundry_id;
    });
    
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    
    // حساب الإيرادات
    const revenue = activeSubscriptions.reduce((sum, sub) => {
      const plan = db.subscriptionPlans.find(p => p.id === sub.plan_id);
      return sum + (plan?.price || 0);
    }, 0);
    
    res.json({
      success: true,
      data: {
        total_plans: plans.length,
        active_plans: plans.filter(p => p.is_active).length,
        total_subscriptions: subscriptions.length,
        active_subscriptions: activeSubscriptions.length,
        expired_subscriptions: subscriptions.filter(s => s.status === 'expired').length,
        monthly_revenue: revenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
