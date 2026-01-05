// =====================================================
// نظام إدارة المغاسل - API العملاء
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../database/mockData');

// جلب جميع العملاء
router.get('/', (req, res) => {
  try {
    const { laundry_id = 1, search, is_vip, page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query;
    
    let filteredCustomers = db.customers.filter(c => c.laundry_id == laundry_id);
    
    // فلترة VIP
    if (is_vip !== undefined) {
      filteredCustomers = filteredCustomers.filter(c => c.is_vip === (is_vip === 'true'));
    }
    
    // البحث
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(c => 
        c.name.toLowerCase().includes(searchLower) || 
        c.phone.includes(search) ||
        (c.email && c.email.toLowerCase().includes(searchLower))
      );
    }
    
    // الترتيب
    filteredCustomers.sort((a, b) => {
      let comparison = 0;
      if (sort === 'total_spent') {
        comparison = a.total_spent - b.total_spent;
      } else if (sort === 'total_orders') {
        comparison = a.total_orders - b.total_orders;
      } else if (sort === 'name') {
        comparison = a.name.localeCompare(b.name, 'ar');
      } else {
        comparison = new Date(a.created_at) - new Date(b.created_at);
      }
      return order === 'desc' ? -comparison : comparison;
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + parseInt(limit));
    
    // إضافة معلومات الاشتراك
    const customersWithSubscription = paginatedCustomers.map(customer => {
      const subscription = db.customerSubscriptions.find(
        s => s.customer_id === customer.id && s.status === 'active'
      );
      const plan = subscription ? db.subscriptionPlans.find(p => p.id === subscription.plan_id) : null;
      
      return {
        ...customer,
        subscription: subscription ? {
          plan_name: plan?.name,
          items_used: subscription.items_used,
          items_limit: plan?.items_limit,
          end_date: subscription.end_date
        } : null
      };
    });
    
    res.json({
      success: true,
      data: customersWithSubscription,
      pagination: {
        total: filteredCustomers.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredCustomers.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب عميل واحد
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const customer = db.customers.find(c => c.id == id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }
    
    // جلب فواتير العميل
    const customerInvoices = db.invoices
      .filter(inv => inv.customer_id == id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);
    
    // جلب اشتراك العميل
    const subscription = db.customerSubscriptions.find(
      s => s.customer_id == id && s.status === 'active'
    );
    const plan = subscription ? db.subscriptionPlans.find(p => p.id === subscription.plan_id) : null;
    
    res.json({
      success: true,
      data: {
        ...customer,
        recent_invoices: customerInvoices,
        subscription: subscription ? {
          ...subscription,
          plan_name: plan?.name,
          items_limit: plan?.items_limit
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// البحث عن عميل بالجوال
router.get('/phone/:phone', (req, res) => {
  try {
    const { phone } = req.params;
    const { laundry_id = 1 } = req.query;
    
    const customer = db.customers.find(c => c.phone === phone && c.laundry_id == laundry_id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إضافة عميل جديد
router.post('/', (req, res) => {
  try {
    const { 
      name, 
      phone, 
      email, 
      address, 
      city,
      notes,
      is_vip = false,
      whatsapp_opted_in = true,
      laundry_id = 1 
    } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'اسم العميل ورقم الجوال مطلوبان' 
      });
    }
    
    // التحقق من تكرار رقم الجوال
    const existingCustomer = db.customers.find(
      c => c.phone === phone && c.laundry_id == laundry_id
    );
    if (existingCustomer) {
      return res.status(400).json({ 
        success: false, 
        message: 'رقم الجوال مسجل مسبقاً',
        data: existingCustomer
      });
    }
    
    const newCustomer = {
      id: db.getNextId(db.customers),
      laundry_id: parseInt(laundry_id),
      name,
      phone,
      email: email || null,
      address: address || null,
      city: city || null,
      notes: notes || null,
      preferences: {},
      is_vip,
      total_orders: 0,
      total_spent: 0,
      whatsapp_opted_in,
      created_at: new Date().toISOString()
    };
    
    db.customers.push(newCustomer);
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة العميل بنجاح',
      data: newCustomer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تحديث عميل
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.customers.findIndex(c => c.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }
    
    // التحقق من تكرار رقم الجوال
    if (req.body.phone && req.body.phone !== db.customers[index].phone) {
      const existingCustomer = db.customers.find(
        c => c.phone === req.body.phone && c.laundry_id === db.customers[index].laundry_id && c.id != id
      );
      if (existingCustomer) {
        return res.status(400).json({ 
          success: false, 
          message: 'رقم الجوال مسجل لعميل آخر' 
        });
      }
    }
    
    db.customers[index] = { 
      ...db.customers[index], 
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'تم تحديث بيانات العميل بنجاح',
      data: db.customers[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// حذف عميل
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.customers.findIndex(c => c.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }
    
    // التحقق من وجود فواتير للعميل
    const hasInvoices = db.invoices.some(inv => inv.customer_id == id);
    if (hasInvoices) {
      return res.status(400).json({ 
        success: false, 
        message: 'لا يمكن حذف العميل لوجود فواتير مرتبطة به' 
      });
    }
    
    const deletedCustomer = db.customers.splice(index, 1)[0];
    
    res.json({
      success: true,
      message: 'تم حذف العميل بنجاح',
      data: deletedCustomer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ترقية/تخفيض عميل VIP
router.patch('/:id/vip', (req, res) => {
  try {
    const { id } = req.params;
    const { is_vip } = req.body;
    const index = db.customers.findIndex(c => c.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }
    
    db.customers[index].is_vip = is_vip !== undefined ? is_vip : !db.customers[index].is_vip;
    
    res.json({
      success: true,
      message: db.customers[index].is_vip ? 'تم ترقية العميل إلى VIP' : 'تم إلغاء VIP',
      data: db.customers[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب سجل طلبات العميل
router.get('/:id/invoices', (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const customer = db.customers.find(c => c.id == id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }
    
    const customerInvoices = db.invoices
      .filter(inv => inv.customer_id == id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedInvoices = customerInvoices.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedInvoices,
      pagination: {
        total: customerInvoices.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(customerInvoices.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إحصائيات العملاء
router.get('/stats/overview', (req, res) => {
  try {
    const { laundry_id = 1 } = req.query;
    
    const customers = db.customers.filter(c => c.laundry_id == laundry_id);
    const vipCustomers = customers.filter(c => c.is_vip);
    const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
    
    // العملاء الجدد هذا الشهر
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = customers.filter(c => new Date(c.created_at) >= thisMonth);
    
    // أفضل العملاء
    const topCustomers = [...customers]
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 5);
    
    res.json({
      success: true,
      data: {
        total: customers.length,
        vip: vipCustomers.length,
        newThisMonth: newThisMonth.length,
        totalRevenue: totalSpent,
        averageSpent: customers.length > 0 ? totalSpent / customers.length : 0,
        topCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
