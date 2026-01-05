// =====================================================
// نظام إدارة المغاسل - API الفواتير
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../database/mockData');
const { v4: uuidv4 } = require('uuid');
const { attachZatcaFields } = require('../utils/zatca');
const { authMiddleware, requireLaundryAccess } = require('../middleware/auth');

// حماية مسارات الفواتير + ربط laundry_id بالمستخدم
router.use(authMiddleware, requireLaundryAccess);

// توليد رقم فاتورة جديد
const generateInvoiceNumber = (laundryId) => {
  const invoices = db.invoices.filter(inv => inv.laundry_id == laundryId);
  const lastNumber = invoices.length > 0 
    ? Math.max(...invoices.map(inv => parseInt(inv.invoice_number.split('-')[1]) || 0))
    : 0;
  return `INV-${String(lastNumber + 1).padStart(3, '0')}`;
};

// حساب الضريبة والمجموع
// ملاحظة: الخصم يُطبَّق على عناصر الفاتورة فقط (ليس على رسوم التوصيل)
const calculateTotals = (items, discountPercent = 0, taxRate = 15, deliveryFee = 0) => {
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const safeDeliveryFee = Math.max(0, Number(deliveryFee) || 0);

  const discountAmount = (itemsSubtotal * discountPercent) / 100;
  const taxableAmount = Math.max(0, itemsSubtotal - discountAmount) + safeDeliveryFee;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(itemsSubtotal * 100) / 100,
    delivery_fee: Math.round(safeDeliveryFee * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    discount_percent: discountPercent,
    tax_rate: taxRate,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

// جلب جميع الفواتير
router.get('/', (req, res) => {
  try {
    const { 
      laundry_id = 1, 
      branch_id, 
      customer_id,
      status, 
      payment_status,
      date_from,
      date_to,
      search,
      page = 1, 
      limit = 50 
    } = req.query;
    
    let filteredInvoices = db.invoices.filter(inv => inv.laundry_id == laundry_id);
    
    // فلترة حسب الفرع
    if (branch_id) {
      filteredInvoices = filteredInvoices.filter(inv => inv.branch_id == branch_id);
    }
    
    // فلترة حسب العميل
    if (customer_id) {
      filteredInvoices = filteredInvoices.filter(inv => inv.customer_id == customer_id);
    }
    
    // فلترة حسب الحالة
    if (status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
    }
    
    // فلترة حسب حالة الدفع
    if (payment_status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.payment_status === payment_status);
    }
    
    // فلترة حسب التاريخ
    if (date_from) {
      filteredInvoices = filteredInvoices.filter(inv => new Date(inv.created_at) >= new Date(date_from));
    }
    if (date_to) {
      filteredInvoices = filteredInvoices.filter(inv => new Date(inv.created_at) <= new Date(date_to));
    }
    
    // البحث
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInvoices = filteredInvoices.filter(inv => {
        const customer = db.customers.find(c => c.id === inv.customer_id);
        return inv.invoice_number.toLowerCase().includes(searchLower) ||
               (customer && customer.name.toLowerCase().includes(searchLower)) ||
               (customer && customer.phone.includes(search));
      });
    }
    
    // ترتيب تنازلي حسب التاريخ
    filteredInvoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // إضافة معلومات إضافية
    const invoicesWithDetails = filteredInvoices.map(inv => {
      const customer = db.customers.find(c => c.id === inv.customer_id);
      const branch = db.branches.find(b => b.id === inv.branch_id);
      const items = db.invoiceItems.filter(item => item.invoice_id === inv.id);
      
      return {
        ...inv,
        customer_name: customer?.name || 'عميل نقدي',
        customer_phone: customer?.phone || '',
        branch_name: branch?.name || '',
        items_count: items.length
      };
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedInvoices = invoicesWithDetails.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedInvoices,
      pagination: {
        total: filteredInvoices.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredInvoices.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب فاتورة واحدة
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.invoices.find(inv => inv.id == id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }
    
    const customer = db.customers.find(c => c.id === invoice.customer_id);
    const branch = db.branches.find(b => b.id === invoice.branch_id);
    const user = db.users.find(u => u.id === invoice.user_id);
    const items = db.invoiceItems.filter(item => item.invoice_id == id);
    
    // إضافة معلومات الخدمة لكل عنصر
    const itemsWithService = items.map(item => {
      const service = db.services.find(s => s.id === item.service_id);
      return {
        ...item,
        service_name_en: service?.name_en || item.name
      };
    });
    
    (async () => {
      const zatca = await attachZatcaFields(db, invoice, invoice.laundry_id || 1);

      // حفظ اختياري داخل البيانات (للاستخدام لاحقًا)
      const invIndex = db.invoices.findIndex((inv) => inv.id == id);
      if (invIndex !== -1) {
        db.invoices[invIndex].zatca_hash = zatca.pseudo_hash;
        db.invoices[invIndex].zatca_qr_code = zatca.tlv_base64;
        db.invoices[invIndex].updated_at = new Date().toISOString();
      }

      res.json({
        success: true,
        data: {
          ...invoice,
          customer: customer || { name: 'عميل نقدي' },
          branch: branch,
          cashier: user ? { id: user.id, name: user.name } : null,
          items: itemsWithService,

          // حقول زاتكا/الضريبة (للعرض والطباعة)
          zatca_seller_name: zatca.seller_name,
          zatca_vat_number: zatca.vat_number,
          zatca_qr_base64: zatca.tlv_base64,
          zatca_qr_image: zatca.qr_image,
          zatca_hash: zatca.pseudo_hash,
        }
      });
    })().catch((error) => {
      res.status(500).json({ success: false, message: error.message });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إنشاء فاتورة جديدة
router.post('/', (req, res) => {
  try {
    const {
      customer_id,
      branch_id,
      items,
      discount_percent = 0,
      payment_method = 'cash',
      delivery_required = false,
      delivery_address,
      delivery_fee = 0,
      courier_name,
      courier_phone,
      notes,
      laundry_id
    } = req.body;

    const effectiveUserId = req.user?.id;
    if (!effectiveUserId) {
      return res.status(401).json({ success: false, message: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const effectiveBranchId = (branch_id !== undefined && branch_id !== null && branch_id !== '')
      ? parseInt(branch_id)
      : (req.user?.branch_id ? parseInt(req.user.branch_id) : 1);

    // إن كان المستخدم مرتبطًا بفرع، امنع إنشاء فاتورة على فرع مختلف (إلا المالك)
    if (req.user?.role_id !== 1 && req.user?.branch_id && parseInt(req.user.branch_id) !== effectiveBranchId) {
      return res.status(403).json({ success: false, message: 'لا يمكنك إنشاء فاتورة على فرع مختلف' });
    }
    
    // التحقق من وجود عناصر
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'يجب إضافة عنصر واحد على الأقل للفاتورة' 
      });
    }
    
    // التحقق من العناصر
    const processedItems = items.map(item => {
      const service = db.services.find(s => s.id == item.service_id);
      return {
        service_id: item.service_id,
        name: service?.name || item.name || 'خدمة',
        quantity: parseFloat(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || service?.price || 0,
        discount_amount: 0
      };
    });
    
    const deliveryRequired = Boolean(delivery_required);
    const normalizedDeliveryFee = deliveryRequired ? Math.max(0, parseFloat(delivery_fee) || 0) : 0;

    // معلومات المندوب: إن لم تُرسل من الواجهة، خذها من حساب المستخدم
    let courierName = courier_name ? String(courier_name) : null;
    let courierPhone = courier_phone ? String(courier_phone) : null;
    if (deliveryRequired && (!courierName || !courierPhone)) {
      const currentUser = db.users.find((u) => u.id == effectiveUserId);
      if (!courierName && currentUser?.name) courierName = String(currentUser.name);
      if (!courierPhone && currentUser?.phone) courierPhone = String(currentUser.phone);
    }

    // حساب المجاميع
    const totals = calculateTotals(processedItems, discount_percent, 15, normalizedDeliveryFee);
    
    // إنشاء الفاتورة
    const newInvoice = {
      id: db.getNextId(db.invoices),
      laundry_id: parseInt(laundry_id),
      branch_id: effectiveBranchId,
      customer_id: customer_id ? parseInt(customer_id) : null,
      user_id: parseInt(effectiveUserId),
      invoice_number: generateInvoiceNumber(laundry_id),
      ...totals,
      status: 'pending',
      payment_status: 'unpaid',
      payment_method,
      delivery_required: deliveryRequired,
      delivery_address: deliveryRequired ? (delivery_address ? String(delivery_address) : null) : null,
      delivery_status: deliveryRequired ? 'pending' : 'none',
      courier_name: deliveryRequired ? courierName : null,
      courier_phone: deliveryRequired ? courierPhone : null,
      due_date: null,
      delivered_at: null,
      paid_at: null,
      zatca_uuid: uuidv4(),
      zatca_hash: null,
      zatca_qr_code: null,
      zatca_status: 'pending',
      notes: notes || null,
      internal_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.invoices.push(newInvoice);
    
    // إضافة العناصر
    const newItems = processedItems.map(item => ({
      id: db.getNextId(db.invoiceItems),
      invoice_id: newInvoice.id,
      service_id: item.service_id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: item.discount_amount,
      total: item.quantity * item.unit_price,
      created_at: new Date().toISOString()
    }));
    
    db.invoiceItems.push(...newItems);
    
    // تحديث إحصائيات العميل
    if (customer_id) {
      const customerIndex = db.customers.findIndex(c => c.id == customer_id);
      if (customerIndex !== -1) {
        db.customers[customerIndex].total_orders += 1;
      }
    }
    
    (async () => {
      const zatca = await attachZatcaFields(db, newInvoice, newInvoice.laundry_id || 1);
      const invIndex = db.invoices.findIndex((inv) => inv.id == newInvoice.id);
      if (invIndex !== -1) {
        db.invoices[invIndex].zatca_hash = zatca.pseudo_hash;
        db.invoices[invIndex].zatca_qr_code = zatca.tlv_base64;
        db.invoices[invIndex].updated_at = new Date().toISOString();
      }

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الفاتورة بنجاح',
        data: {
          ...newInvoice,
          items: newItems,
          zatca_seller_name: zatca.seller_name,
          zatca_vat_number: zatca.vat_number,
          zatca_qr_base64: zatca.tlv_base64,
          zatca_qr_image: zatca.qr_image,
          zatca_hash: zatca.pseudo_hash,
        }
      });
    })().catch((error) => {
      res.status(500).json({ success: false, message: error.message });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تحديث حالة الفاتورة
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const index = db.invoices.findIndex(inv => inv.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }
    
    const validStatuses = ['draft', 'pending', 'processing', 'ready', 'delivered', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'حالة غير صالحة' });
    }
    
    const oldStatus = db.invoices[index].status;
    db.invoices[index].status = status;
    db.invoices[index].updated_at = new Date().toISOString();
    
    // تسجيل إلغاء الفاتورة في رادار الاحتيال
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      db.auditLogs.push({
        id: db.getNextId(db.auditLogs),
        laundry_id: db.invoices[index].laundry_id,
        branch_id: db.invoices[index].branch_id,
        user_id: 1,
        action_type: 'invoice_cancel',
        entity_type: 'invoice',
        entity_id: parseInt(id),
        old_value: { status: oldStatus },
        new_value: { status: 'cancelled' },
        description: `تم إلغاء الفاتورة ${db.invoices[index].invoice_number}`,
        risk_level: 'high',
        is_flagged: true,
        created_at: new Date().toISOString()
      });
    }
    
    if (status === 'delivered') {
      db.invoices[index].delivered_at = new Date().toISOString();
    }

    // مزامنة حالة التوصيل (إن كانت الفاتورة توصيل)
    if (db.invoices[index].delivery_required) {
      if (status === 'delivered') db.invoices[index].delivery_status = 'delivered';
      else if (status === 'cancelled') db.invoices[index].delivery_status = 'cancelled';
      else if (['pending', 'processing', 'ready'].includes(status)) db.invoices[index].delivery_status = status;
    }
    
    res.json({
      success: true,
      message: 'تم تحديث حالة الفاتورة',
      data: db.invoices[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تسجيل الدفع
router.post('/:id/payment', (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method = 'cash', reference_number, notes } = req.body;
    const index = db.invoices.findIndex(inv => inv.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }
    
    const invoice = db.invoices[index];
    
    if (invoice.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'الفاتورة مدفوعة مسبقاً' });
    }
    
    // تحديث الفاتورة
    db.invoices[index].payment_status = 'paid';
    db.invoices[index].payment_method = payment_method;
    db.invoices[index].paid_at = new Date().toISOString();
    db.invoices[index].updated_at = new Date().toISOString();
    
    // تحديث إجمالي مصروفات العميل
    if (invoice.customer_id) {
      const customerIndex = db.customers.findIndex(c => c.id == invoice.customer_id);
      if (customerIndex !== -1) {
        db.customers[customerIndex].total_spent += invoice.total;
      }
    }
    
    res.json({
      success: true,
      message: 'تم تسجيل الدفع بنجاح',
      data: db.invoices[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تعديل خصم الفاتورة
router.patch('/:id/discount', (req, res) => {
  try {
    const { id } = req.params;
    const { discount_percent } = req.body;
    const index = db.invoices.findIndex(inv => inv.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }
    
    if (db.invoices[index].payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'لا يمكن تعديل فاتورة مدفوعة' });
    }
    
    const oldDiscount = db.invoices[index].discount_percent;
    
    // إعادة حساب المجاميع
    const items = db.invoiceItems.filter(item => item.invoice_id == id);
    const totals = calculateTotals(
      items.map(i => ({ quantity: i.quantity, unit_price: i.unit_price })),
      discount_percent,
      db.invoices[index].tax_rate,
      db.invoices[index].delivery_fee || 0
    );
    
    db.invoices[index] = {
      ...db.invoices[index],
      ...totals,
      updated_at: new Date().toISOString()
    };
    
    // تسجيل في رادار الاحتيال
    if (oldDiscount !== discount_percent) {
      db.auditLogs.push({
        id: db.getNextId(db.auditLogs),
        laundry_id: db.invoices[index].laundry_id,
        branch_id: db.invoices[index].branch_id,
        user_id: 1,
        action_type: 'discount_change',
        entity_type: 'invoice',
        entity_id: parseInt(id),
        old_value: { discount: oldDiscount },
        new_value: { discount: discount_percent },
        description: `تم تعديل الخصم على فاتورة ${db.invoices[index].invoice_number} من ${oldDiscount}% إلى ${discount_percent}%`,
        risk_level: discount_percent > 20 ? 'high' : 'medium',
        is_flagged: true,
        created_at: new Date().toISOString()
      });
    }
    
    (async () => {
      const zatca = await attachZatcaFields(db, db.invoices[index], db.invoices[index].laundry_id || 1);
      db.invoices[index].zatca_hash = zatca.pseudo_hash;
      db.invoices[index].zatca_qr_code = zatca.tlv_base64;
      db.invoices[index].updated_at = new Date().toISOString();

      res.json({
        success: true,
        message: 'تم تحديث الخصم',
        data: {
          ...db.invoices[index],
          zatca_seller_name: zatca.seller_name,
          zatca_vat_number: zatca.vat_number,
          zatca_qr_base64: zatca.tlv_base64,
          zatca_qr_image: zatca.qr_image,
          zatca_hash: zatca.pseudo_hash,
        }
      });
    })().catch((error) => {
      res.status(500).json({ success: false, message: error.message });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إحصائيات الفواتير
router.get('/stats/overview', (req, res) => {
  try {
    const { laundry_id = 1, branch_id, date_from, date_to } = req.query;
    
    let invoices = db.invoices.filter(inv => inv.laundry_id == laundry_id);
    
    if (branch_id) {
      invoices = invoices.filter(inv => inv.branch_id == branch_id);
    }
    
    // فلترة حسب التاريخ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayInvoices = invoices.filter(inv => new Date(inv.created_at) >= today);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const monthInvoices = invoices.filter(inv => new Date(inv.created_at) >= thisMonth);
    
    // حسابات
    const todaySales = todayInvoices
      .filter(inv => inv.payment_status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const monthSales = monthInvoices
      .filter(inv => inv.payment_status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const pendingOrders = invoices.filter(inv => 
      ['pending', 'processing'].includes(inv.status)
    ).length;
    
    const readyOrders = invoices.filter(inv => inv.status === 'ready').length;
    
    res.json({
      success: true,
      data: {
        todaySales: Math.round(todaySales * 100) / 100,
        monthSales: Math.round(monthSales * 100) / 100,
        todayOrders: todayInvoices.length,
        monthOrders: monthInvoices.length,
        pendingOrders,
        readyOrders,
        avgOrderValue: monthInvoices.length > 0 
          ? Math.round((monthSales / monthInvoices.filter(i => i.payment_status === 'paid').length) * 100) / 100 
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
