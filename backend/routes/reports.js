// =====================================================
// نظام إدارة المغاسل - API التقارير
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../database/mockData');

// تقرير المبيعات
router.get('/sales', (req, res) => {
  try {
    const { laundry_id = 1, branch_id, date_from, date_to, group_by = 'day' } = req.query;
    
    let invoices = db.invoices.filter(inv => 
      inv.laundry_id == laundry_id && inv.payment_status === 'paid'
    );
    
    if (branch_id) {
      invoices = invoices.filter(inv => inv.branch_id == branch_id);
    }
    
    // فلترة حسب التاريخ
    if (date_from) {
      invoices = invoices.filter(inv => new Date(inv.created_at) >= new Date(date_from));
    }
    if (date_to) {
      invoices = invoices.filter(inv => new Date(inv.created_at) <= new Date(date_to));
    }
    
    // تجميع البيانات
    const salesByDate = {};
    invoices.forEach(inv => {
      const date = new Date(inv.created_at);
      let key;
      
      if (group_by === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (group_by === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!salesByDate[key]) {
        salesByDate[key] = { date: key, total: 0, count: 0, tax: 0 };
      }
      salesByDate[key].total += inv.total;
      salesByDate[key].tax += inv.tax_amount;
      salesByDate[key].count += 1;
    });
    
    const salesData = Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date));
    
    // ملخص
    const summary = {
      total_sales: invoices.reduce((sum, inv) => sum + inv.total, 0),
      total_tax: invoices.reduce((sum, inv) => sum + inv.tax_amount, 0),
      total_invoices: invoices.length,
      average_invoice: invoices.length > 0 
        ? invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length 
        : 0
    };
    
    res.json({
      success: true,
      data: {
        sales: salesData,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تقرير العملاء
router.get('/customers', (req, res) => {
  try {
    const { laundry_id = 1, sort = 'total_spent', limit = 20 } = req.query;
    
    let customers = db.customers.filter(c => c.laundry_id == laundry_id);
    
    // ترتيب
    customers.sort((a, b) => {
      if (sort === 'total_orders') return b.total_orders - a.total_orders;
      return b.total_spent - a.total_spent;
    });
    
    customers = customers.slice(0, parseInt(limit));
    
    // ملخص
    const allCustomers = db.customers.filter(c => c.laundry_id == laundry_id);
    const summary = {
      total_customers: allCustomers.length,
      vip_customers: allCustomers.filter(c => c.is_vip).length,
      total_revenue: allCustomers.reduce((sum, c) => sum + c.total_spent, 0),
      average_per_customer: allCustomers.length > 0 
        ? allCustomers.reduce((sum, c) => sum + c.total_spent, 0) / allCustomers.length 
        : 0
    };
    
    res.json({
      success: true,
      data: {
        customers,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تقرير الخدمات
router.get('/services', (req, res) => {
  try {
    const { laundry_id = 1, date_from, date_to } = req.query;
    
    let invoiceItems = db.invoiceItems;
    
    // فلترة حسب التاريخ عبر الفواتير
    if (date_from || date_to) {
      const filteredInvoiceIds = db.invoices
        .filter(inv => {
          if (inv.laundry_id != laundry_id) return false;
          if (date_from && new Date(inv.created_at) < new Date(date_from)) return false;
          if (date_to && new Date(inv.created_at) > new Date(date_to)) return false;
          return true;
        })
        .map(inv => inv.id);
      
      invoiceItems = invoiceItems.filter(item => filteredInvoiceIds.includes(item.invoice_id));
    }
    
    // تجميع حسب الخدمة
    const serviceStats = {};
    invoiceItems.forEach(item => {
      const serviceId = item.service_id || 'other';
      if (!serviceStats[serviceId]) {
        const service = db.services.find(s => s.id === item.service_id);
        serviceStats[serviceId] = {
          id: serviceId,
          name: service?.name || item.name,
          name_en: service?.name_en || item.name,
          quantity: 0,
          revenue: 0,
          count: 0
        };
      }
      serviceStats[serviceId].quantity += item.quantity;
      serviceStats[serviceId].revenue += item.total;
      serviceStats[serviceId].count += 1;
    });
    
    const servicesData = Object.values(serviceStats)
      .sort((a, b) => b.revenue - a.revenue);
    
    res.json({
      success: true,
      data: {
        services: servicesData,
        summary: {
          total_services: servicesData.length,
          total_revenue: servicesData.reduce((sum, s) => sum + s.revenue, 0),
          total_quantity: servicesData.reduce((sum, s) => sum + s.quantity, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تقرير الفروع
router.get('/branches', (req, res) => {
  try {
    const { laundry_id = 1, date_from, date_to } = req.query;
    
    const branches = db.branches.filter(b => b.laundry_id == laundry_id);
    
    const branchStats = branches.map(branch => {
      let invoices = db.invoices.filter(inv => 
        inv.branch_id === branch.id && inv.payment_status === 'paid'
      );
      
      if (date_from) {
        invoices = invoices.filter(inv => new Date(inv.created_at) >= new Date(date_from));
      }
      if (date_to) {
        invoices = invoices.filter(inv => new Date(inv.created_at) <= new Date(date_to));
      }
      
      return {
        id: branch.id,
        name: branch.name,
        name_en: branch.name_en,
        total_invoices: invoices.length,
        total_sales: invoices.reduce((sum, inv) => sum + inv.total, 0),
        total_tax: invoices.reduce((sum, inv) => sum + inv.tax_amount, 0),
        employees_count: db.users.filter(u => u.branch_id === branch.id).length
      };
    });
    
    res.json({
      success: true,
      data: {
        branches: branchStats,
        summary: {
          total_branches: branches.length,
          total_sales: branchStats.reduce((sum, b) => sum + b.total_sales, 0),
          total_invoices: branchStats.reduce((sum, b) => sum + b.total_invoices, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تقرير المدفوعات
router.get('/payments', (req, res) => {
  try {
    const { laundry_id = 1, date_from, date_to } = req.query;
    
    let invoices = db.invoices.filter(inv => 
      inv.laundry_id == laundry_id && inv.payment_status === 'paid'
    );
    
    if (date_from) {
      invoices = invoices.filter(inv => new Date(inv.created_at) >= new Date(date_from));
    }
    if (date_to) {
      invoices = invoices.filter(inv => new Date(inv.created_at) <= new Date(date_to));
    }
    
    // تجميع حسب طريقة الدفع
    const paymentMethods = {};
    invoices.forEach(inv => {
      const method = inv.payment_method || 'cash';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { method, count: 0, total: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].total += inv.total;
    });
    
    const methodLabels = {
      cash: 'نقداً',
      card: 'بطاقة',
      transfer: 'تحويل',
      online: 'إلكتروني',
      subscription: 'اشتراك'
    };
    
    const paymentsData = Object.values(paymentMethods).map(p => ({
      ...p,
      label: methodLabels[p.method] || p.method
    }));
    
    res.json({
      success: true,
      data: {
        payments: paymentsData,
        summary: {
          total_payments: invoices.length,
          total_amount: invoices.reduce((sum, inv) => sum + inv.total, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// لوحة التحكم - ملخص شامل
router.get('/dashboard', (req, res) => {
  try {
    const { laundry_id = 1, branch_id } = req.query;
    
    let invoices = db.invoices.filter(inv => inv.laundry_id == laundry_id);
    if (branch_id) {
      invoices = invoices.filter(inv => inv.branch_id == branch_id);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const todayInvoices = invoices.filter(inv => new Date(inv.created_at) >= today);
    const monthInvoices = invoices.filter(inv => new Date(inv.created_at) >= thisMonth);
    
    const paidToday = todayInvoices.filter(inv => inv.payment_status === 'paid');
    const paidMonth = monthInvoices.filter(inv => inv.payment_status === 'paid');
    
    res.json({
      success: true,
      data: {
        today: {
          sales: paidToday.reduce((sum, inv) => sum + inv.total, 0),
          orders: todayInvoices.length,
          paid: paidToday.length,
          pending: todayInvoices.filter(inv => inv.status === 'pending').length
        },
        month: {
          sales: paidMonth.reduce((sum, inv) => sum + inv.total, 0),
          orders: monthInvoices.length,
          paid: paidMonth.length,
          tax: paidMonth.reduce((sum, inv) => sum + inv.tax_amount, 0)
        },
        pending_orders: invoices.filter(inv => ['pending', 'processing'].includes(inv.status)).length,
        ready_orders: invoices.filter(inv => inv.status === 'ready').length,
        total_customers: db.customers.filter(c => c.laundry_id == laundry_id).length,
        new_customers_month: db.customers.filter(c => 
          c.laundry_id == laundry_id && new Date(c.created_at) >= thisMonth
        ).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
